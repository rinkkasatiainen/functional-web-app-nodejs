import {Application, Request, Response, Router} from "express";
import {Pool} from "pg";

import {authRoutes} from "./auth";
import {indexRoute} from "./index";
import {seekerRoutes} from "./seeker/index";
import {userRoutes} from "./user";

import {postgresQuestionRepo} from "../../infrastructure/db/postgres-question-repo";
import {postgresUser} from "../../infrastructure/db/postgres-users";
import {postgresEventStore} from "../../infrastructure/event_store/postgres-event-store";
import {uuidProvider} from "../../infrastructure/uuid-provider";

import {FutureResult} from "../../domain/actions/action";
import {getMessageForUser, openMessageForUser} from "../../domain/actions/seeker/open-message-for-user";
import {approveMessage, createNewThread, editMessage, postMessage} from "../../domain/actions/seeker/post-message";
import {removeMessageThread} from "../../domain/actions/seeker/remove-message-thread";
import {limit as settingsLimit} from "../../domain/repositories/limit";
import {
    messageCommandRepository,
    messageQueryRepository,
    messageRepository,
} from "../../domain/repositories/message-repository";
import {removeAccount} from "../../domain/repositories/remove-account";
import {Users} from "../../domain/repositories/user-repository";
import {isAuthenticated} from "../../domain/validators/is-logged-in";
import {validateM} from "../../helpers/chain";
import {toMaybe} from "../../helpers/sanctuary/toMaybe";
import {postgresSettingsStore} from "../../infrastructure/db/postgres-settings-store";
import {handleFuture} from "./helpers/convert-to-response";
import {handleErrors, handleSuccess} from "./mapper/map-left-error-to-request";

export const routes: (a: Router) => (b: Pool) => (c: Application) => (d: Server.Authenticate) => Router =
    router => pool => app => auth => {

        const repository = messageRepository(postgresEventStore(pool))(postgresQuestionRepo(pool));
        const userRepository = Users(postgresUser(pool));
        const queryRepository = messageQueryRepository(repository)(userRepository);
        const messageCmdRepository = messageCommandRepository(repository);
        const removeAccuontAction = removeAccount(postgresUser(pool))(postgresQuestionRepo(pool));

        const removeThreadForeverCommandHandler =
            removeMessageThread({...queryRepository, ...messageCmdRepository})(removeAccuontAction);
        const postMessageCommandHandler = postMessage(repository);
        const approveMessageCommandHandler = approveMessage(repository);
        const createNewMessageCommandHandler = createNewThread(repository)(userRepository);
        const editMessageCommandHandler = editMessage(repository);
        const persistentSettingsStore = postgresSettingsStore(pool);
        const limit = settingsLimit(persistentSettingsStore)(postgresQuestionRepo(pool));
        const adapters = {limit, uuidProvider: uuidProvider(pool)};

        router.get("/", indexRoute);
        userRoutes(router);

        router.use("/secret", getSecret)
        app.use("/auth", authRoutes(auth)(adapters));

        seekerRoutes(adapters)({
            approveMessageCommandHandler,
            createNewMessageCommandHandler,
            editMessageCommandHandler,
            getMessageQueryHandler: getMessageForUser(queryRepository),
            openMessageCommandHandler: openMessageForUser({...messageCmdRepository, ...queryRepository}),
            postMessageCmdHandler: postMessageCommandHandler,
            removeThreadForeverCommandHandler,
        })(router);
        return router;
    };

const secretQueryHandler: (x?: LoginAccount.User) => FutureResult<LoginAccount.User> =
    (userAccountDetails) => {
        const isValid = validateM<LoginAccount.User, void>([
            isAuthenticated,
        ])(toMaybe(userAccountDetails));

        return isValid.result;
    };

export const getSecret = (req: Request, res: Response) => {
    const user = req.user;

    const onError = handleErrors([
        ({res: r}) => () => { r.sendStatus(401); },
    ]);

    const onSuccess = handleSuccess<LoginAccount.User>([
        ({res: r}) => () => { r.sendStatus(200); },
        ({res: r}) => ({value}) => { r.json(value); },
    ]);

    const handle = handleFuture<LoginAccount.User>({req, res});
    handle(onError)(onSuccess)(secretQueryHandler(user));
};

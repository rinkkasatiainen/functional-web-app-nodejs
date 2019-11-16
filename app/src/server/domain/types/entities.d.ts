import {FutureInstance} from "fluture";
import {Moment} from "moment";

declare global {

    interface MessageBehavior {
        approveAMessage: (x: ApproveMessageCommand) => FutureInstance<DomainError, UncommittedMessageEntity>;
        postAMessage: (x: PostAQuestionCommand) => FutureInstance<DomainError, UncommittedMessageEntity>;
        createNewMessageThread: (x: CreateNewThreadCommand) => FutureInstance<DomainError, UncommittedMessageEntity>;
        editMessage: (x: EditAQuestionCommand) => FutureInstance<DomainError, UncommittedMessageEntity>;
        markAsRemoved: () => FutureInstance<DomainError, UncommittedMessageEntity>;
        openedMessageThread: () => FutureInstance<DomainError, Message.UncommittedEntity>;
    }

    interface MessageEntity extends MessageData {
        // id: StreamId;
        // version: number;
        act: MessageBehavior;
        lastMessageSentAt: () => string;
    }

    interface UncommittedDomainEntity extends DomainEntity {
        // tslint:disable-next-line
        uncommittedChanges: DomainEvents.Stream;
    }

    interface UncommittedMessageEntity extends MessageEntity, UncommittedDomainEntity {
        originalVersion: number;
    }

    interface MessageData extends DomainEntity {
        messages: QuestionResponse[];
        title?: string;
        allowedActions: SeekerActions.AllowedMessageActions;
        allowedToOpenUntil: Moment;
    }

    interface QuestionResponse {
        question: SeekerQuestion;
        response?: OnDutyResponse;
        draftResponse?: OnDutyResponse;
    }

    interface SeekerQuestion {
        time: string;
        text: string;
    }

    interface OnDutyResponse {
        time: string;
        text: string;
    }
}

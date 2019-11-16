import {Message} from "../message";

declare global {
    interface MessageThreadProjection extends Projection {
        messageId: StreamId;
        messages: QuestionResponse[];
        title: string;
        allowedActions: SeekerActions.AllowedMessageActions;
        allowedSeekerActions?: SeekerActions.AllowedSeekerActons;
        lastMessageSentAt: string;
    }
}

export interface Message {
    uuid: string;
    messages: MessageThread;
}

export type MessageThread = QuestionResponse[];

interface QuestionResponse { question: SeekerQuestion; response?: DutyResponse; }

interface SeekerQuestion {
    time: string;
    text: string;
}
interface DutyResponse {
    time: string;
    text: string;
}

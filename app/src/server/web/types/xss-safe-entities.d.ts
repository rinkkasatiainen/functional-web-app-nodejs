export as namespace XSSSafe

export interface QuestionResponse {
    question: SeekerQuestion;
    response?: OnDutyResponse;
}

export interface SeekerQuestion {
    date: string;
    xssSafeText: string;
}

export interface OnDutyResponse {
    date: string;
    xssSafeText: string;
}

export interface Statistics {
    age: number;
    area: number;
    relation: number;
}

export interface WholeThread {
    streamId: StreamId;
    numberOfQuestions: number;
    xssSafeTitle: string;
    thread: QuestionResponse[];
    statistics: Statistics;
    xssSafeUsername: string;
    actions: Web.AllowedSeekerActions;
}

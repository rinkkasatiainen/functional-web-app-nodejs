interface Request {
    path?: string;
}

interface Maybe<A> {
    constructor: {
        "@@type": "sanctuary/Maybe";
    };
}

interface Left<A> {
    constructor: {
        "@@type": "sanctuary/Left";
    };
}

interface Right<A> {
    constructor: {
        "@@type": "sanctuary/Right";
    };
}

interface Either<A, B> {
    constructor: {
        "@@type": "sanctuary/Either";
    };
}

// type Dictionary<T> = Partial<{ [key: string]: Readonly<Partial<T>> }>;

interface LeftLike<T> { value: T; }
interface RightLike<T> { value: T; }
type OnLeft<T> = (x: LeftLike<T>) => void;
type OnRight<T> = (x: RightLike<T>) => void;

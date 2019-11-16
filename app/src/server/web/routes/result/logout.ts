import {WithToken} from "./handle-future";

export const logout = <T extends WithToken>(): T => ({token: undefined} as T);

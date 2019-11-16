import * as moment from "moment";
import {Moment} from "moment";

moment.locale("fi-fi");
const momentNow = moment.now;

export const now: () => number =
    () => momentNow();

export const isLaterThan: (x: Moment) => boolean =
    lastReadTime => lastReadTime.valueOf() > now();

export const yesterday: () => Moment =
    () => {
        const somewhereInThePast = now() - 100000;
        // @ts-ignore
        return new moment(somewhereInThePast);
    };

export const addDays: (x: number) => (x: number) => Moment =
    // @ts-ignore
    days => time => new moment(time).add(days, "day");

export const timeToCalendar: (x: number | Moment) => string =
    // @ts-ignore
    time => new moment(time).calendar();

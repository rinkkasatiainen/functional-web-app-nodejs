import {toWebActions} from "./get-actions";

export const createActions:
    (x: { locationName?: string, locationId?: number, streamId?: string })
        => (y: SeekerActions.AllowedMessageActions)  => Web.AllowedMessageActions =
    ({locationName, locationId, streamId}) => allowedActions => {
        return toWebActions<SeekerActions.AllowedMessageActions, Web.AllowedMessageActions>({
            locationId,
            locationName,
            streamId,
        })(allowedActions);
    };

export const createSeekerActions:
    (x: { locationName?: string, locationId?: number, streamId?: string })
        => (y?: SeekerActions.AllowedSeekerActons)  => Web.AllowedSeekerActions =
    ({locationName, locationId, streamId}) => allowedActions => {
        if (allowedActions) {
            return toWebActions({
                locationId,
                locationName,
                streamId,
            })(allowedActions);
        }
        return {};
    };

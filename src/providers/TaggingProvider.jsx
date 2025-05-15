/* eslint-disable react-refresh/only-export-components */

import { createContext, useEffect, useMemo, useState } from "react";

export const TAG_TYPES = {
    TAG: "tag",
    CHAPTER: "chapter",
};

export const TaggingContext = createContext({
    taggingStreamId: "",
    tags: [],
    groups: [],
    setCurrentId: () => {},
    setTags: () => {},
    setGroups: () => {},
});

export const TagOffsetPopupProvider = ({ children }) => {
    const [taggingStreamId, setTaggingStreamId] = useState(localStorage.getItem("taggingStreamId") || "");
    const [tags, setTags] = useState(localStorage.getItem("tags") || []); // { type, timestamp, name, groupName, details(if chapter)}
    const [groups, setGroups] = useState(localStorage.getItem("groups") || []); // list of names
    const taggingValues = useMemo(
        () => ({ taggingStreamId, tags, groups, setTaggingStreamId, setTags, setGroups }),
        [taggingStreamId, tags, groups],
    );

    useEffect(() => {
        localStorage.setItem("taggingStreamId", taggingStreamId)
    }, [taggingStreamId]);
    useEffect(() => {
        localStorage.setItem("tags", tags)
    }, [tags]);
    useEffect(() => {
        localStorage.setItem("groups", groups)
    }, [groups]);

    return <TaggingContext.Provider value={taggingValues}>{children}</TaggingContext.Provider>;
};

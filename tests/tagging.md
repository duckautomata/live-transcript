## Input Page

- timestamps are correctly parsed and fixed. 00 -> 00:01.
- tags are correctly sorted by timestamp.
- append tags correctly updates the lists without affecting previous edits.
- Groups have some leadway. Boss fights and bossfight map to the same group. Group title should be whatever the first group used as the group name.
- Input is saved across sessions
- Any gaps, extra lines, are not included in the formatted tags or output.

## Formatted Tags

### Format list

- Groups always appear at the top, tags inside the group are sorted by time.
- Chapters are sorted by time.
- Birthday group is always at the bottom, and the tags inside are sorted by time.
- Each tag has an option to disable / enable it. Disabled tags are not included in the output.
- Each tag has an option to edit the text and timestamp. Going back to input, then appending new tags should not affect previous edits.
- When editing a tag, pressing escape dismisses the edit, and pressing enter accepts the edit.
- Tags are correctly sorted by time/groups and how they will appear in the output.
- Hovering over a tag should highlight it, the chapter/group it is in, and that chapter/group's name in the Header list. If a tag has a parent.
- Chapters have an option to edit the text and timestamp.
- Editing a chapters text should update it in the Headers list.
- Editing a chapters timestamp should update what tags are children of it. Either adding or removing them.
- Prevent duplicate chapter names from being created. If there are duplicate names in the input, then combine them together into one chapter. Case insensitive.
- Disabling all tags in a group/chapter will also disable that group/chapter. Disabled groups/chapters should appear disabled in the headers list.
- HBD (birthday tags) should always appear at the very bottom and be treated as a special group.
- Hovering over a chapter/groups title should show what the original title was.
- Titles should have a \*\* around them. This is used to bold the text when pasting it.

### Header list

- Groups (if any) at the top. Chapters (if any) below groups. Birthday (if any) at the very bottom.
- If there are multiple groups, there is an arrow to change the order of the group. Changing the order should also change it in the format list and in the output.
- Groups and chapters can be disabled / enabled. When disabling a group, the tags are moved back to their original spot and put under a chapter if there is one. Disabled chapters move the tags to a different chapter, if there is one.
- edge case: When disabling a group or chapter, the moved tags should correctly highlight its new parent.
- Clicking on a title will jump to it in the format list and highlight it temporary.

### Bulk Edit

- Offset, enable/disable, and F&R does what it says.
- Highlight timestamps works correctly
- When highlighting a tag, hovering over it should display the original text.
- Updating any of the text, timestamps, enable/disable, or using the bulk edit options should automatically update the highlights.

## Output (Copy to Clipboard)

- Groups and chapters should have an empty line to space them out. The first few tags until it reaches a chapter should also have an empty line that separates it from the first chapter or birthday group.
- Disabled lines are not in the output.
- Any edits, new tags/titles, censors are correctly shown in the output.

## Transcript View

- Tags, chapters, group tags, and birthday tags are correctly underlined to the nearest segment, and the underline is correctly colored. Hovering over it should show the context.
- Tag context should be [timestamp] text
- Birthday context should be Birthday: [timestamp] text
- Chapter title should be chapter: text
- Group tag should be collection: group name [timestamp] text
- If a tag exists beyond the transcript, then do not display it.
- When creating a new group, the group name should be a typeable dropdown. Either select an existing group, or type the name of a new group.
- When creating a new chapter, the chapter name should also be a typeable dropdown to show existing chapters. But it should show an error if your new chapter name already exists. Chapters must be unique. Case insensitive
- Newly created tags, chapters, groups should appear correctly in the formatted list and output.

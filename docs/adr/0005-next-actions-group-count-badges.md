# ADR 0005: Show Next Action Counts on Group Headers

## Status

Accepted

## Context

The Next Actions view grouped visible actions into pinned, dated, default, and context-based sections, but it only showed a single aggregate count at the bottom of the view. That footer total did not help users understand the size of each displayed group while scanning the grouped list, and it could be misleading because one action can appear in multiple groups under the existing grouping rules.

## Decision

Render a count badge beside every displayed group header in the Next Actions view and remove the bottom aggregate count.

The badge value is derived directly from `group.actions.length` for the current rendered group. When one action is intentionally displayed in multiple groups, each group badge counts that action within that group.

## Alternatives Considered

Keep the footer total and add nothing to group headers.
This preserves the existing layout but does not meet the requirement to show counts where users scan category information.

Show both per-group badges and the footer total.
This adds redundant count concepts and keeps a footer that does not reflect the primary grouped presentation.

Change grouping to make the footer total non-overlapping.
This would alter grouping behavior and falls outside the requested scope.

## Behavior Impact

Users now see the size of each rendered category directly beside the category label. The grouped display rules, group ordering, and action ordering remain unchanged.

## Consequences

The view becomes easier to scan by section, and the implementation stays aligned with the existing grouping model. Reviewers should confirm that all displayed groups, including pinned, are intended to receive the same badge treatment.

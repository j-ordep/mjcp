export type CalendarSelectionMark = {
  selected: boolean;
  selectedColor: string;
};

const DEFAULT_SELECTION_COLOR = "#000";

export function createCalendarSelectionMark(): CalendarSelectionMark {
  return {
    selected: true,
    selectedColor: DEFAULT_SELECTION_COLOR,
  };
}

export function toggleCalendarDateSelection(input: {
  selectedDays: Record<string, CalendarSelectionMark>;
  dateString: string;
  allowMultipleDates: boolean;
  isEdit?: boolean;
}) {
  const { selectedDays, dateString, allowMultipleDates, isEdit = false } = input;

  if (!allowMultipleDates || isEdit) {
    return {
      [dateString]: createCalendarSelectionMark(),
    };
  }

  const nextSelectedDays = { ...selectedDays };

  if (nextSelectedDays[dateString]) {
    delete nextSelectedDays[dateString];
    return nextSelectedDays;
  }

  nextSelectedDays[dateString] = createCalendarSelectionMark();
  return nextSelectedDays;
}

export function collapseCalendarSelectionToSingleDate(
  selectedDays: Record<string, CalendarSelectionMark>,
) {
  const firstDate = Object.keys(selectedDays).sort()[0];

  if (!firstDate) {
    return {};
  }

  return {
    [firstDate]: createCalendarSelectionMark(),
  };
}

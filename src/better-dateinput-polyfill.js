/*!
 * better-dateinput-polyfill (https://github.com/chemerisuk/better-dateinput-polyfill)
 * input[type=date] polyfill for better-dom (https://github.com/chemerisuk/better-dom)
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 */
DOM.extend("input[type=date]", [
    "div[hidden].%CLS%>p.%CLS%-header+a.%CLS%-prev+a.%CLS%-next+table.%CLS%-days>thead>tr>th[data-i18n=calendar.weekday.$]*7+tbody>tr*6>td*7".replace(/%CLS%/g, "better-dateinput-calendar")
], {
    constructor: function(calendar) {
        this
            // remove legacy dateinput if it exists
            .set("type", "text")
            // sync value on click
            .on("click", this, "_syncInputWithCalendar", [calendar])
            // handle arrow keys, esc etc.
            .on("keydown(keyCode,ctrlKey)", this, "_handleCalendarKeyDown", [calendar]);

        calendar.findAll("a").invoke("on", "click(target)", this, "_handleCalendarNavClick");
        calendar.on("click(target) td", this, "_handleCalendarDayClick", [calendar]);
                
        // hide calendar when a user clicks somewhere outside
        DOM.on("click", this, "_handleDocumentClick", [calendar]);

        // cache access to some elements
        this.bind("_refreshCalendar",
            calendar.find(".better-dateinput-calendar-header"),
            calendar.findAll("td")
        );

        this.after(calendar);

        // show calendar for autofocused elements
        if (this.isFocused()) this.fire("focus");
    },
    getCalendarDate: function() {
        return this.getData("calendarDate");
    },
    setCalendarDate: function(value) {
        this._refreshCalendar(value);

        return this;
    },
    _handleCalendarDayClick: function(target, calendar) {
        var calendarDate = this.getCalendarDate(),
            currentYear = calendarDate.getFullYear(),
            currentMonth = calendarDate.getMonth(),
            targetDate = new Date(currentYear, currentMonth,
                target.parent().get("rowIndex") * 7 + target.get("cellIndex") - 5 - new Date(currentYear, currentMonth, 1).getDay()
            );

        this.setCalendarDate(targetDate);
        this._syncCalendarWithInput(calendar);

        // prevent focusing after click if the input is inside of a label
        return false;
    },
    _handleCalendarNavClick: function(target) {
        var isNext = target.hasClass("better-dateinput-calendar-next"),
            calendarDate = this.getCalendarDate(),
            targetDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + (isNext ? 1 : -1), 1);

        this.setCalendarDate(targetDate).fire("focus");

        return false;
    },
    _handleCalendarKeyDown: function(keyCode, ctrlKey, calendar) {
        if (keyCode === 9) return; // skip TAB key

        var currentDate = this.getCalendarDate(),
            delta = 0;

        if (keyCode === 13) {
            calendar.toggle(); // show/hide calendar on enter key
        } else if (keyCode === 27 || keyCode === 9) {
            calendar.hide(); // esc or tab key hides calendar
        } else if (keyCode === 8 || keyCode === 46) {
            this.set(""); // backspace or delete clears the value
        } else {
            if (keyCode === 74 || keyCode === 40) { delta = 7; }
            else if (keyCode === 75 || keyCode === 38) { delta = -7; }
            else if (keyCode === 76 || keyCode === 39) { delta = 1; }
            else if (keyCode === 72 || keyCode === 37) { delta = -1; }

            if (delta) {
                if (ctrlKey) {
                    currentDate.setMonth(currentDate.getMonth() + (delta > 0 ? 1 : -1));
                } else {
                    currentDate.setDate(currentDate.getDate() + delta);
                }

                this.setCalendarDate(currentDate)._syncCalendarWithInput(calendar, true);
            }
        }
        // do not allow to change the value via manual input
        return false;
    },
    _syncInputWithCalendar: function(calendar, skipCalendar) {
        var value = (this.get("value") || "").split("-");
        // switch calendar to the input value date
        this.setCalendarDate(value.length > 1 ? new Date( parseInt(value[0],10), parseInt(value[1],10) - 1, parseInt(value[2],10)) : new Date());

        if (!skipCalendar) calendar.show();
    },
    _syncCalendarWithInput: function(calendar, skipCalendar) {
        var date = this.getCalendarDate(),
            zeroPadMonth = ("00" + (date.getMonth() + 1)).slice(-2),
            zeroPadDate = ("00" + date.getDate()).slice(-2);

        this.set(date.getFullYear() + "-" + zeroPadMonth + "-" + zeroPadDate);

        if (!skipCalendar) calendar.hide();
    },
    _refreshCalendar: function(calendarCaption, calendarDays, value) {
        var iterDate = new Date(value.getFullYear(), value.getMonth(), 0);
        // update caption
        calendarCaption.set("<span data-i18n='calendar.month." + value.getMonth() + "'> " + (isNaN(value.getFullYear()) ? "" : value.getFullYear()));
        
        if (!isNaN(iterDate.getTime())) {
            // move to begin of the start week
            iterDate.setDate(iterDate.getDate() - iterDate.getDay());
            
            calendarDays.each(function(day) {
                iterDate.setDate(iterDate.getDate() + 1);
                
                var mDiff = value.getMonth() - iterDate.getMonth(),
                    dDiff = value.getDate() - iterDate.getDate();

                if (value.getFullYear() !== iterDate.getFullYear()) {
                    mDiff *= -1;
                }

                day.set("className", mDiff ?
                    (mDiff > 0 ? "prev-calendar-day" : "next-calendar-day") :
                    (dDiff ? "calendar-day" : "current-calendar-day")
                );

                day.set(iterDate.getDate().toString());
            });

            // update current date
            this.setData("calendarDate", value);
        }
    },
    _handleDocumentClick: function(calendar) {
        if (!this.isFocused()) calendar.hide();
    }
});

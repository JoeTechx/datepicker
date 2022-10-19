function getWeekNumber(date) {
  const firstDayOfTheYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfTheYear) / 86400000;

  return Math.ceil((pastDaysOfYear + firstDayOfTheYear.getDay() + 1) / 7);
}

function isLeapYear(year) {
  return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
}

class Day {
  constructor(date = null, lang = "default") {
    date = date ?? new Date();

    this.Date = date;
    this.date = date.getDate();
    this.day = date.toLocaleString(lang, { weekday: "long" });
    this.dayNumber = date.getDay() + 1;
    this.dayShort = date.toLocaleString(lang, { weekday: "short" });
    this.year = date.getFullYear();
    this.yearShort = Number(date.toLocaleString(lang, { year: "2-digit" }));
    this.month = date.toLocaleString(lang, { month: "long" });
    this.monthShort = date.toLocaleString(lang, { month: "short" });
    this.monthNumber = Number(date.toLocaleString(lang, { month: "2-digit" }));
    this.timestamp = date.getTime();
    this.hours = date.getHours();
    this.minutes = date.getMinutes();
    this.seconds = date.getSeconds();
    this.week = getWeekNumber(date);
  }
  get isToday() {
    return this.isEqualTo(new Date());
  }

  isEqualTo(date) {
    date = date instanceof Day ? date.Date : date;

    return (
      date.getDate() === this.date &&
      date.getMonth() === this.monthNumber - 1 &&
      date.getFullYear() === this.year
    );
  }

  format(formatStr) {
    return formatStr
      .replace(/\bYYYY\b/, this.year)
      .replace(/\bYYY\b/, this.yearShort)
      .replace(/\bWW\b/, this.week.toString().padStart(2, "0"))
      .replace(/\bW\b/, this.week)
      .replace(/\bDDDD\b/, this.day)
      .replace(/\bDDD\b/, this.dayShort)
      .replace(/\bDD\b/, this.date.toString().padStart(2, "0"))
      .replace(/\bD\b/, this.date)
      .replace(/\bMMMM\b/, this.month)
      .replace(/\bMMM\b/, this.monthShort)
      .replace(/\bMM\b/, this.monthNumber.toString().padStart(2, "0"))
      .replace(/\bM\b/, this.monthNumber);
  }
}

const day = new Day();

console.log("--day", day);

class Month {
  constructor(date = null, lang = "default") {
    const day = new Day(date, lang);
    const monthSize = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    this.lang = lang;

    this.name = day.month;
    this.number = day.monthNumber;
    this.year = day.year;
    this.numberOfDays = monthSize[this.number - 1];

    if (this.number === 2) {
      this.numberOfDays += isLeapYear(day.year) ? 1 : 0;
    }
    this[Symbol.iterator] = function* () {
      let number = 1;
      yield this.getDay(number);
      while (number < this.numberOfDays) {
        ++number;
        yield this.getDay(number);
      }
    };
  }
  getDay(date) {
    return new Day(new Date(this.year, this.number - 1, date), this.lang);
  }
}

const month = new Month();

console.log(month, ...month);

class Calendar {
  weekDays = Array.from({ length: 7 });
  constructor(year = null, monthNumber = null, lang = "default") {
    this.today = new Day(null, lang);
    this.year = year ?? this.today.year;
    this.month = new Month(
      new Date(this.year, (monthNumber || this.today.monthNumber) - 1),
      lang
    );
    this.lang = lang;

    this[Symbol.iterator] = function* () {
      let number = 1;
      yield this.getMonth(number);
      while (number < 12) {
        ++number;
        yield this.getMonth(number);
      }
    };
    this.weekDays.forEach((_, i) => {
      const day = this.month.getDay(i);
      if (!this.weekDays.includes(day.day)) {
        this.weekDays[day.dayNumber - 1] = day.day;
      }
    });
  }
  get isLeapYear() {
    return isLeapYear(this.year);
  }
  getMonth(monthNumber) {
    return new Month(new Date(this.year, monthNumber - 1), this.lang);
  }

  getPreviousMonth() {
    if (this.month.number === 1) {
      return new Month(new Date(this.year - 1, 11), this.lang);
    }
    return new Month(new Date(this.year, this.month.number - 2), this.lang);
  }

  getNextMonth() {
    if (this.month.number === 12) {
      return new Month(new Date(this.year + 1, 0), this.lang);
    }
    return new Month(new Date(this.year, this.month.number + 2), this.lang);
  }

  goToDate(monthNumber, year) {
    this.month = new Month(new Date(year, monthNumber - 1), this.lang);
    this.year = year;
  }
  goToNextYear() {
    this.year += 1;
    this.month = new Month(new Date(this.year, 0), this.lang);
  }
  goToPreviousYear() {
    this.year -= 1;
    this.month = new Month(new Date(this.year, 11), this.lang);
  }

  goToNextMonth() {
    if (this.month.number === 12) {
      return this.goToNextYear();
    }
    this.month = new Month(
      new Date(this.year, this.month.number + 1 - 1),
      this.lang
    );
  }

  goToPreviousMonth() {
    if (this.month.number === 1) {
      return this.goToPreviousYear();
    }
    this.month = new Month(
      new Date(this.year, this.month.number - 1 - 1),
      this.lang
    );
  }
}
const cal = new Calendar();

console.log(cal);

class DatePicker extends HTMLElement {
  format = "MM DD, YYYY";
  position = "bottom";
  visible = false;
  date = null;
  mounted = false;
  //element
  toggleButton = null;
  calendarDropDown = null;
  calendarDateElement = null;
  calendarDaysContainer = null;

  constructor() {
    super();

    const lang = window.navigator.language;
    const date = new Date(
      this.date ?? (this.getAttribute("date") || Date.now())
    );

    this.shadow = this.attachShadow({ mode: "open" });
    this.date = new Day(date, lang);
    this.calendar = new Calendar(this.date.year, this.date.monthNumber, lang);

    this.format = this.getAttribute("format") || this.format;
    this.position = DatePicker.position.includes(this.getAttribute("position"))
      ? this.getAttribute("position")
      : this.position;
    this.visible =
      this.getAttribute("visible") === "" ||
      this.getAttribute("visible") === "true" ||
      this.visible;

    this.render();
  }

  connectedCallback() {
    this.mounted = true;

    this.toggleButton = this.shadow.querySelector(".date-toggle");
    this.calendarDropDown = this.shadow.querySelector(".calendar-dropdown");
    this.calendarDateElement = this.shadow.querySelector("h4");
    const [prevBtn, calendarDateElement, nextButton] = this.calendarDropDown.querySelector(".header").children;
    this.calendarDateElement = calendarDateElement;
    this.calendarDaysContainer = this.calendarDropDown.querySelector('.month-days');


    this.toggleButton.addEventListener("click", () => this.toggleCalendar());
    prevBtn.addEventListener("click", () => this.prevMonth());
    nextButton.addEventListener("click", () => this.nextMonth());
    document.addEventListener("click", (e) => this.handleClickOut(e));

  
    this.getMonthDaysGrid();
  }

  toggleCalendar(visible = null) {
    if(visible === null) {
      this.calendarDropDown.classList.toggle('visible');
    } else if(visible) {
      this.calendarDropDown.classList.add('visible');
    } else {
      this.calendarDropDown.classList.remove('visible');
    }
    
    this.visible = this.calendarDropDown.className.includes('visible');

    if(!this.isCurrentCalendarMonth()) {
      this.calendar.goToDate(this.date.monthNumber, this.date.year);
      this.updateHeaderText();
    }
  }

  prevMonth() {
    this.calendar.goToPreviousMonth();
    this.updateHeaderText();
  }

  nextMonth() {
    this.calendar.goToNextMonth();
    this.updateHeaderText();
  }

  updateHeaderText() {
    this.calendarDateElement.textContent = 
     `${this.calendar.month.name}, ${this.calendar.year}`
  }

  isCurrentCalendarMonth() {
    return this.calendar.month.number === this.date.monthNumber && 
    this.calendar.year === this.date.year;
  }


  handleClickOut(e) {
    if(this.visible && (this !== e.target)) {
      this.toggleCalendar(false);
    }
  }

  getWeekDaysElementStrings(){
    return this.calendar.weekDays
    .map(weekDay => `<span>${weekDay.substring(0, 3)}</span>`)
    .join("")
  }

  getMonthDaysGrid() {
    const firstDayOfTheMonth = this.calendar.month.getDay(1);
    const totalLastMonthFinalDays = firstDayOfTheMonth.dayNumber - 1;
    const totalDays = this.calendar.month.numberOfDays + totalLastMonthFinalDays;
    const monthList = Array.from({length: totalDays})

    for(let i = totalLastMonthFinalDays; i < totalDays; i++){
      monthList[i] = this.calendar.month.getDay(i + 1 - totalLastMonthFinalDays);
    }

    console.log(monthList);
    
  }
  
 updateMonthDays() {
  this.calendarDaysContainer.innerHTML = '';
 this.getMonthDaysGrid().forEach(day => {
const el = document.createElement('button');
el.className = 'month-day';
if(day){
  el.textContent = day.day
}

this.calendarDaysContainer.appendChild(el);
 })
 }
  static get position() {
    return ["top", "left", "bottom", "right"];
  }

  get style() {
    return `
  :host{
    position: relative;
    font-family: "Montserrat", sans-serif;
  }

  .date-toggle {
    padding: 8px 4px 0;
    padding: 8px 15px;
    border: none;
    font-family: "Montserrat", sans-serif;
    // border-bottom: 1px solid;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    // background: none;
    color:#94959a;
    border-radius: 6px;
    font-weight: 600;
    // padding-right: 2rem;
    cursor: pointer;
    text-transform: capitalize;
    text-align: left;
    border-color: #c3c2c8;
  }
.calendar-dropdown{
  width: 300px;
  display: none;
  // height: 300px;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 8px);
  padding: 20px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
}

.calendar-dropdown.visible{
  display: block;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 30px;
}
.header h4 {
margin: 0;
text-transform: capitalize;
font-size: 21px;
font-weight: bold;
}

.header button {
  padding: 0;
  border: 8px solid transparent;
  width: 0;
  height: 0;
  border-radius: 2px;
  border-top-color: #222;
  transform: rotate(90deg);
  background: none;
  position: relative;
  cursor: pointer;
}

.header button::after {
  content: '';
  display: block;
  width: 25px;
  height: 25px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.header button:last-of-type {
  transform: rotate(-90deg);
}

.week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 5px;
  margin-bottom: 10px;
}

.week-days span{
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
}
  `;
  }
  render() {
    const monthYear = `${this.calendar.month.name}, ${this.calendar.year}`;
    const date = this.date.format(this.format);
    this.shadow.innerHTML = `
  <style>${this.style}</style>
  <button type = "button" class= "date-toggle">${date}</button>
  <div class="calendar-dropdown ${this.visible ? "visible" : ""} ${this.position}">
<div class="header">
    <button type="button" class="prev-month" aria-label="previous month"></button>
<h4>
 ${monthYear}
</h4>

    <button type="button" class="prev-month" aria-label="next month"></button>
</div>
<div class="week-days">${this.getWeekDaysElementStrings()}</div>
<div class="month-days"></div>
  </div>
  `;
  }
}

customElements.define("date-picker", DatePicker);
const picker = new DatePicker();
console.log(picker);

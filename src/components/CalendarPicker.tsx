/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string; // "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  accentColor: 'rose' | 'amber';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarPicker({ selectedDate, onChange, accentColor }: CalendarPickerProps) {
  // Parse initial selectedDate or fall back to today
  const getParsedDate = (str: string) => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = getParsedDate(selectedDate);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Update view month/year if selectedDate changes externally
  useEffect(() => {
    const d = getParsedDate(selectedDate);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  }, [selectedDate]);

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  };

  const selectDate = (year: number, month: number, day: number) => {
    const formatted = formatDateString(year, month, day);
    onChange(formatted);
  };

  const handleQuickPreset = (daysDiff: number) => {
    const target = new Date();
    target.setDate(target.getDate() - daysDiff);
    const formatted = formatDateString(target.getFullYear(), target.getMonth(), target.getDate());
    onChange(formatted);
  };

  // Build the list of 42 grid items (6 weeks * 7 days)
  const daysGrid: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean }> = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYearVal = currentMonth === 0 ? currentYear - 1 : currentYear;
    daysGrid.push({
      day: daysInPrevMonth - i,
      month: prevMonthIdx,
      year: prevYearVal,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }

  // Next month padding days to fill 42 cells
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    daysGrid.push({
      day: i,
      month: nextMonthIdx,
      year: nextYearVal,
      isCurrentMonth: false
    });
  }

  const activeThemeColor = accentColor === 'rose'
    ? {
        border: 'border-rose-500/30',
        text: 'text-rose-450 text-rose-400',
        bg: 'bg-rose-500 hover:bg-rose-400 text-slate-950 font-black',
        ring: 'focus:border-rose-500 focus:ring-rose-500/25',
        dot: 'bg-rose-500',
        btnActive: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        line: 'border-rose-950'
      }
    : {
        border: 'border-amber-500/30',
        text: 'text-amber-450 text-amber-500',
        bg: 'bg-amber-500 hover:bg-amber-450 text-slate-950 font-black',
        ring: 'focus:border-amber-500 focus:ring-amber-550/25',
        dot: 'bg-amber-500',
        btnActive: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
        line: 'border-amber-950'
      };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-inner`}>
      {/* Calendar header with months & years navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className={`h-3.5 w-3.5 ${activeThemeColor.text}`} />
          <span className="text-xs font-mono font-bold text-slate-200">
            {MONTHS[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
              onChange(formatDateString(today.getFullYear(), today.getMonth(), today.getDate()));
            }}
            className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 font-mono text-slate-300 hover:text-white rounded cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((day, i) => (
          <span key={i} className="text-[9px] font-mono tracking-widest uppercase font-bold text-slate-500 py-0.5">
            {day}
          </span>
        ))}
      </div>

      {/* Monthly Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((item, idx) => {
          const itemDateStr = formatDateString(item.year, item.month, item.day);
          const isSelected = itemDateStr === selectedDate;
          const isToday = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === itemDateStr;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => selectDate(item.year, item.month, item.day)}
              className={`
                day-cell h-7 w-full flex flex-col items-center justify-center text-[11px] font-mono rounded transition-all cursor-pointer relative
                ${isSelected 
                  ? activeThemeColor.bg
                  : item.isCurrentMonth
                    ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-900/40 hover:text-slate-400'
                }
                ${isToday && !isSelected ? 'border border-slate-700 bg-slate-900/50' : 'border border-transparent'}
              `}
            >
              <span>{item.day}</span>
              {isToday && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${activeThemeColor.dot}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick selection chips */}
      <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-900 text-[10px] font-mono justify-center">
        <button
          type="button"
          onClick={() => handleQuickPreset(0)}
          className={`px-2 py-1 rounded text-[9px] cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(1)}
          className="px-2 py-1 rounded text-[9px] cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all"
        >
          Yesterday
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(7)}
          className="px-2 py-1 rounded text-[9px] cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all"
        >
          1 Wk Ago
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(14)}
          className="px-2 py-1 rounded text-[9px] cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all"
        >
          2 Wks Ago
        </button>
      </div>
    </div>
  );
}

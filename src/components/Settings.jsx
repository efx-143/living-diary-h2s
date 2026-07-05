import React, { useState, useEffect } from 'react';
import { Sun, Moon, Smartphone, Languages, Lock, Bell } from 'lucide-react';
import { getPersistentValue, setPersistentValue } from '../services/storage';
// --- NEW --- Import the Capacitor LocalNotifications plugin
import { LocalNotifications } from '@capacitor/local-notifications';

export default function Settings({ theme, setTheme, language, setLanguage }) {
  const SHA256 = require("crypto-js/sha256");

  const themes = [ { id: 'light', name: 'Light', icon: Sun }, { id: 'dark', name: 'Dark', icon: Moon }, { id: 'oled', name: 'OLED', icon: Smartphone }];
  const languages = [ { id: 'english', name: 'English' }, { id: 'hinglish', name: 'Hinglish' }, { id: 'hindi', name: 'हिंदी' }, { id: 'marathi', name: 'मराठी' }];
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("21:00");

  // --- NEW --- Check notification status on component load
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          setNotificationsEnabled(true);
          const time = pending.notifications[0].schedule.at;
          if (time) {
            const hour = time.getHours().toString().padStart(2, '0');
            const minute = time.getMinutes().toString().padStart(2, '0');
            setNotificationTime(`${hour}:${minute}`);
          }
        }
      } catch(e) {
        console.error("Could not check notification status on this platform.");
      }
    };
    checkNotificationStatus();
  }, []);


  const handleSetPin = () => {
    const pin = prompt("Enter a new 4-digit PIN:");
    if (pin && /^\d{4}$/.test(pin)) {
      const confirmPin = prompt("Confirm your 4-digit PIN:");
      if (pin === confirmPin) {
        const hash = SHA256(pin).toString();
        setPersistentValue("pinHash", hash);
        alert("PIN has been set successfully! The app will be locked the next time you open it.");
      } else {
        alert("PINs do not match. Please try again.");
      }
    } else if (pin !== null) {
      alert("Invalid PIN. Please enter exactly 4 digits.");
    }
  };

  const handleRemovePin = async () => {
    const savedPinHash = await getPersistentValue("pinHash");
    if (!savedPinHash) {
      alert("No PIN is currently set.");
      return;
    }

    const pin = prompt("To remove the lock, please enter your current 4-digit PIN:");
    if (pin && /^\d{4}$/.test(pin)) {
      const inputHash = SHA256(pin).toString();
      if (inputHash === savedPinHash) {
        setPersistentValue("pinHash", null); // Remove the hash by setting it to null
        alert("App lock has been removed.");
      } else {
        alert("Incorrect PIN.");
      }
    } else if (pin !== null) {
      alert("Invalid PIN. Please enter exactly 4 digits.");
    }
  };

  // --- MODIFIED --- This function now uses the Capacitor plugin to schedule real native notifications
  const handleNotificationToggle = async (enabled) => {
    try {
      if (enabled) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') {
          alert("Notification permission was denied. You can change this in your phone's settings.");
          return;
        }

        // Cancel any old notifications before setting a new one
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }

        const [hour, minute] = notificationTime.split(':');

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1, // Static ID to ensure we only have one reminder
              title: "Living Diary",
              body: "Don't forget to write in your diary today!",
              schedule: {
                on: {
                  hour: parseInt(hour),
                  minute: parseInt(minute)
                },
                repeats: true // This makes it a daily reminder
              },
              smallIcon: 'res://mipmap/ic_launcher',
              largeIcon: 'res://mipmap/ic_launcher'
            }
          ]
        });
        setNotificationsEnabled(true);
        alert(`Daily reminder set for ${notificationTime}.`);

      } else { // Disabling notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
        setNotificationsEnabled(false);
        alert("Daily reminder has been cancelled.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong with the notification settings.");
    }
  };

  const handleTimeChange = (e) => {
    setNotificationTime(e.target.value);
    // If notifications are already on, reschedule with the new time
    if (notificationsEnabled) {
      handleNotificationToggle(true);
    }
  };


  return (
    <div className="p-4 animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Settings</h1>
      
      {/* Theme Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="grid grid-cols-3 gap-4">
          {themes.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} className={`p-4 flex flex-col items-center justify-center rounded-lg border-2 transition-colors ${theme === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
              <t.icon size={24} className={theme === t.id ? 'text-purple-500' : 'text-gray-500'} />
              <span className="mt-2 text-sm font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Languages size={20} /> Language</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {languages.map(l => (
            <button key={l.id} onClick={() => setLanguage(l.id)} className={`p-4 flex items-center justify-center rounded-lg border-2 transition-colors ${language === l.id ? 'border-purple-500 bg-purple-500/10 text-purple-500' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}>
              <span className="text-sm font-medium">{l.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* App Lock Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lock size={20} /> App Lock</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleSetPin} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Set / Change PIN
          </button>
          <button onClick={handleRemovePin} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Remove PIN
          </button>
        </div>
      </div>

      {/* Notification Settings UI */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell size={20} /> Daily Reminder</h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-300">Enable daily notifications</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={notificationsEnabled} onChange={(e) => handleNotificationToggle(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
        {notificationsEnabled && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <label htmlFor="notif-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reminder time:</label>
            <input
              type="time"
              id="notif-time"
              value={notificationTime}
              onChange={handleTimeChange}
              className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-transparent focus:ring-2 focus:ring-purple-500 rounded-md shadow-sm p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
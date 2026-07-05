import React from 'react';
import { Instagram, Linkedin, Github, BookOpen } from 'lucide-react';

export default function About() {
  const socialLinks = [
    { icon: Instagram, url: 'https://www.instagram.com/efx_.69/', 'aria-label': 'Instagram' },
    { icon: Github, url: 'https://github.com/efx-143', 'aria-label': 'GitHub' },
    { icon: Linkedin, url: 'https://www.linkedin.com/in/sanyam-chavan-b3499b368/', 'aria-label': 'LinkedIn' },
  ];

  return (
    <div className="p-4 animate-fade-in text-center flex flex-col items-center min-h-full">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md mt-8">
        <BookOpen size={48} className="mx-auto text-indigo-500 mb-4" />
        <h1 className="text-3xl font-bold">Living Diary</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Version 1.0.1</p>

        <div className="bg-gray-100 dark:bg-gray-700/50 p-10 rounded-lg">
          <img
            // Using a stylish, high-quality anime avatar as a placeholder
            src="https://media.licdn.com/dms/image/v2/D4D03AQFcRlPrL-iLWA/profile-displayphoto-scale_200_200/B4DZgdoh.XGQAY-/0/1752843821883?e=1762387200&v=beta&t=kW37BPnU3yPVnstzC5WlBNgPcGFn6jOhFrtkprj7O9I" 
            alt="Developer Avatar"
            className="w-24 h-24 rounded-full object-cover mx-auto -mt-16 mb-4 border-4 border-white dark:border-gray-800 shadow-xl"
          />
          <h2 className="text-lg font-semibold">Developed & Designed by</h2>
          <p className="text-xl text-indigo-500 font-bold mb-4">Sanyam Chavan</p>
          
          <div className="flex justify-center space-x-4">
            {socialLinks.map((social, index) => (
              // The 'a' tag makes the links work
              <a 
                key={index} 
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-600/50 transition-colors"
                aria-label={social['aria-label']}
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="mt-auto pt-8 text-gray-500 text-sm">
        Made with ❤️ in Pune
      </footer>
    </div>
  );
}
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-lighter border-t border-gray-200 dark:border-gray-700 py-4 px-4 sm:px-6 w-full">
      <div className="mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 dark:text-gray-500">
            © {currentYear} TrackNToms POS. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0 text-sm text-gray-400 dark:text-gray-500">
            Version 1.2.0
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
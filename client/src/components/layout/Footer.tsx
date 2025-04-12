import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="mt-10 py-8 bg-white border-t border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">
                FL
              </div>
              <span className="ml-2 text-primary font-bold text-lg">FootLink</span>
            </div>
            <p className="text-neutral-500 text-sm mt-2">
              The professional networking platform for football
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/about">
              <a className="text-neutral-600 hover:text-primary text-sm">About</a>
            </Link>
            <Link href="/privacy">
              <a className="text-neutral-600 hover:text-primary text-sm">Privacy</a>
            </Link>
            <Link href="/terms">
              <a className="text-neutral-600 hover:text-primary text-sm">Terms</a>
            </Link>
            <Link href="/help">
              <a className="text-neutral-600 hover:text-primary text-sm">Help Center</a>
            </Link>
            <Link href="/contact">
              <a className="text-neutral-600 hover:text-primary text-sm">Contact Us</a>
            </Link>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="flex space-x-4">
              <a href="https://twitter.com" className="text-neutral-600 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://facebook.com" className="text-neutral-600 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://instagram.com" className="text-neutral-600 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://youtube.com" className="text-neutral-600 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-neutral-500 text-xs">
          <p>&copy; {new Date().getFullYear()} FootLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

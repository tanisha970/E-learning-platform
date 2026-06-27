// src/components/common/Footer.jsx (with dark mode)
import { Link } from "react-router-dom";
import { FiBookOpen, FiGithub, FiLinkedin } from "react-icons/fi";

const Footer = () => (
  <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-10 mt-auto border-t border-gray-800 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
          <FiBookOpen className="text-blue-400" />
          LearnHub
        </div>
        <p className="text-sm leading-relaxed">
          A modern e-learning platform to upskill yourself with expert-led courses.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/courses" className="hover:text-white transition">Browse Courses</Link></li>
          <li><Link to="/register" className="hover:text-white transition">Get Started</Link></li>
          <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Connect</h4>
        <div className="flex gap-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
            <FiGithub size={20} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
            <FiLinkedin size={20} />
          </a>
        </div>
      </div>
    </div>
    <div className="text-center text-xs mt-8 text-gray-600">
      © {new Date().getFullYear()} LearnHub. Built with React + Node.js
    </div>
  </footer>
);

export default Footer;

import { Recycle, Facebook, Instagram, Twitter, Mail, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">ReWear</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Building a sustainable fashion community where every piece of clothing gets a second chance. 
              Join us in reducing textile waste, one swap at a time.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/add-item" className="text-primary-foreground/80 hover:text-white transition-colors">
                  List an Item
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-primary-foreground/80 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/80 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 ReWear. All rights reserved.
          </p>
          <div className="flex items-center text-primary-foreground/60 text-sm mt-4 md:mt-0">
            Made with <Heart className="h-4 w-4 mx-1 text-red-400" /> for the planet
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
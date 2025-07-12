import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Recycle, User, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-105 transition-transform duration-300">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">ReWear</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/browse"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Browse Items
            </Link>
            <Link
              to="/how-it-works"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              How It Works
            </Link>
            <Link
              to="/sustainability"
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Sustainability
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/add-item">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                List Item
              </Button>
            </Link>
            <Link to="/favorites">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero" size="sm">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleMenu}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            <Link
              to="/browse"
              className="block text-muted-foreground hover:text-primary transition-colors"
              onClick={toggleMenu}
            >
              Browse Items
            </Link>
            <Link
              to="/how-it-works"
              className="block text-muted-foreground hover:text-primary transition-colors"
              onClick={toggleMenu}
            >
              How It Works
            </Link>
            <Link
              to="/sustainability"
              className="block text-muted-foreground hover:text-primary transition-colors"
              onClick={toggleMenu}
            >
              Sustainability
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              <Link to="/add-item" onClick={toggleMenu}>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  List Item
                </Button>
              </Link>
              <Link to="/dashboard" onClick={toggleMenu}>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/login" onClick={toggleMenu}>
                <Button variant="hero" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
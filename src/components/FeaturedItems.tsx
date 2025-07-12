import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Star, Clock, ArrowRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface FeaturedItem {
  _id: string;
  title: string;
  description: string;
  image_url: string;
  size: string;
  condition: string;
  points: number;
  category: string;
  createdAt: string;
  likes: number;
  status: string;
  user_id: {
    username: string;
    avatar_url: string;
  };
}

const fetchFeaturedItems = async (): Promise<FeaturedItem[]> => {
  const res = await fetch("/api/items/featured");
  if (!res.ok) throw new Error("Failed to fetch featured items");
  return res.json();
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const FeaturedItems = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 3;

  useEffect(() => {
    fetchFeaturedItems()
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerView >= items.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, items.length - itemsPerView) : prev - 1
    );
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Like New": return "bg-success text-success-foreground";
      case "Excellent": return "bg-primary text-primary-foreground";
      case "Good": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section className="py-16 bg-gradient-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Items
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing pieces from our community. Each item tells a story and is ready for its next adventure.
          </p>
        </div>

        {/* Carousel or Placeholder */}
        {loading ? (
          <div className="text-center py-16 text-lg text-muted-foreground">Loading featured items...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <PlusCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">Our community is just getting started!</h3>
            <p className="text-lg text-muted-foreground mb-6">List an item to get featured here.</p>
            <Link to="/add-item">
              <Button variant="hero" size="lg">
                List Your First Item
              </Button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-medium"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm shadow-medium"
              disabled={currentIndex + itemsPerView >= items.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-8">
              {visibleItems.map((item) => (
                <Card key={item._id} className="group hover:shadow-strong transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Condition Badge */}
                    <Badge className={`absolute top-2 left-2 ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <Badge variant="outline" className="text-primary border-primary">
                        Size {item.size}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {item.likes}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {getTimeAgo(item.createdAt)}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {item.points} pts
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/item/${item._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button variant="hero" className="flex-1" disabled={item.status !== 'available'}>
                        Request Swap
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dots Indicator */}
        {items.length > 0 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(items.length / itemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerView)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  Math.floor(currentIndex / itemsPerView) === index
                    ? "bg-primary scale-125"
                    : "bg-muted hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/browse">
            <Button variant="hero" size="lg">
              Browse All Items
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedItems;
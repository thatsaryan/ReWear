import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Grid, List, Heart, Clock, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { itemsAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Item {
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
  tags: string[];
  user_id: {
    _id: string;
    username: string;
    avatar_url?: string;
  };
}

const Browse = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const filters = {
          category: filterCategory !== 'all' ? filterCategory : undefined,
          size: filterSize !== 'all' ? filterSize : undefined,
          condition: filterCondition !== 'all' ? filterCondition : undefined,
          search: searchTerm || undefined,
          sort: sortBy
        };
        
        const itemsData = await itemsAPI.getAll(filters);
        setItems(itemsData);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchTerm, sortBy, filterCategory, filterSize, filterCondition]);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Like New": return "bg-success text-success-foreground";
      case "Excellent": return "bg-primary text-primary-foreground";
      case "Good": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse Items
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover amazing pieces from our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow-soft p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Jackets">Jackets</SelectItem>
                  <SelectItem value="Sweaters">Sweaters</SelectItem>
                  <SelectItem value="Dresses">Dresses</SelectItem>
                  <SelectItem value="Shoes">Shoes</SelectItem>
                  <SelectItem value="Skirts">Skirts</SelectItem>
                  <SelectItem value="Shirts">Shirts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Size
              </label>
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Condition
              </label>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="Like New">Like New</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Points: Low to High</SelectItem>
              <SelectItem value="price-high">Points: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        ) : (
          /* Items Grid */
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {items.map((item) => (
              <Card key={item._id} className="group hover:shadow-strong transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className="relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Like Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    <Heart className="h-4 w-4 text-white" />
                  </Button>

                  {/* Condition Badge */}
                  <Badge className={`absolute top-2 left-2 ${getConditionColor(item.condition)}`}>
                    {item.condition}
                  </Badge>
                </div>

                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/item/${item._id}`}>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    <Badge variant="outline" className="text-primary border-primary">
                      Size {item.size}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

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
                    <Link to={`/item/${item._id}`} className="flex-1">
                      <Button variant="hero" className="w-full">
                        Request Swap
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No items found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all categories
            </p>
            <Button onClick={() => {
              setSearchTerm("");
              setFilterCategory("all");
              setFilterSize("all");
              setFilterCondition("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
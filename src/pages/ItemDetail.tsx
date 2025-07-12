import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { itemsAPI, swapsAPI, usersAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Heart, 
  Share2, 
  ArrowLeft, 
  Package, 
  User, 
  Calendar,
  Eye,
  MessageCircle,
  ArrowLeftRight,
  Award,
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface Item {
  _id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  type: string;
  size: string;
  condition: string;
  points: number;
  status: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  user_id: {
    _id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    points: number;
  };
}

interface UserItem {
  _id: string;
  title: string;
  image_url: string;
  category: string;
  size: string;
  condition: string;
  points: number;
}

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [swapMessage, setSwapMessage] = useState("");
  const [pointsOffered, setPointsOffered] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);
  const [isSubmittingRedeem, setIsSubmittingRedeem] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const itemData = await itemsAPI.getById(id);
        setItem(itemData);
        setLikeCount(itemData.likes || 0);
        
        // Check if user has liked this item
        if (user?.id && token) {
          // This would require a separate API call to check like status
          // For now, we'll assume not liked
          setIsLiked(false);
        }
      } catch (error: any) {
        console.error('Error fetching item:', error);
        if (error.status === 404) {
          setError('This item is no longer available');
        } else {
          setError('Failed to load item');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, user?.id, token]);

  // Fetch user's available items for swap modal
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!token || !user?.id) return;
      
      try {
        const items = await usersAPI.getItems(token);
        // Filter for available items only
        const availableItems = items.filter((item: any) => item.status === 'available');
        setUserItems(availableItems);
      } catch (error) {
        console.error('Error fetching user items:', error);
      }
    };

    if (showSwapDialog) {
      fetchUserItems();
    }
  }, [showSwapDialog, token, user?.id]);

  const handleLike = async () => {
    if (!user?.id || !item?._id || !token) return;

    try {
      if (isLiked) {
        await itemsAPI.unlike(item._id, token);
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await itemsAPI.like(item._id, token);
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleSwapRequest = async () => {
    if (!user?.id || !item?._id || !token) return;

    setIsSubmittingSwap(true);
    try {
      await swapsAPI.create({
        item_id: item._id,
        offered_item_id: selectedItemId || undefined,
        points_offered: pointsOffered,
        message: swapMessage
      }, token);
      
      setShowSwapDialog(false);
      setSwapMessage("");
      setPointsOffered(0);
      setSelectedItemId("");
      
      toast({
        title: "Success",
        description: "Swap request sent successfully!",
      });
      
      // Refresh item data to update status
      const updatedItem = await itemsAPI.getById(item._id);
      setItem(updatedItem);
    } catch (error: any) {
      console.error('Error creating swap request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create swap request';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  const handleRedeemWithPoints = async () => {
    if (!user?.id || !item?._id || !token) return;

    setIsSubmittingRedeem(true);
    try {
      await swapsAPI.create({
        item_id: item._id,
        points_offered: item.points,
        message: "Redeeming with points"
      }, token);
      
      setShowRedeemDialog(false);
      
      toast({
        title: "Success",
        description: "Item redeemed successfully!",
      });
      
      // Refresh item data to update status
      const updatedItem = await itemsAPI.getById(item._id);
      setItem(updatedItem);
    } catch (error: any) {
      console.error('Error redeeming item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to redeem item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRedeem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!user?.id || !item?._id || !token) return;

    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await itemsAPI.delete(item._id, token);
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const shareItem = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.title,
        text: `Check out this item on ReWear: ${item?.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Item link copied to clipboard",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'swapped': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-card">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "This item may have been removed"}</p>
            <Button onClick={() => navigate('/browse')}>
              Browse Other Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id._id;
  const isAvailable = item.status === 'available';
  const canSwap = !isOwner && isAvailable && user?.id;
  const canRedeem = !isOwner && isAvailable && user?.id && user.points >= item.points;
  const hasAvailableItems = userItems.length > 0;

  return (
    <div className="min-h-screen bg-gradient-card">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{item.title}</h1>
              <p className="text-muted-foreground">
                Listed by {item.user_id.full_name || item.user_id.username}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className={isLiked ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button variant="outline" size="sm" onClick={shareItem}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FR4.1 - Full Item Display: Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Item Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {item.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {likeCount} likes
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* FR4.1 - Full Item Display: Item Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">{item.title}</h2>
                      {/* FR4.3 - Availability Status */}
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'available' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {item.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {item.status === 'swapped' && <XCircle className="h-3 w-3 mr-1" />}
                        {item.status}
                      </Badge>
                    </div>
                    
                    {item.description && (
                      <p className="text-muted-foreground">{item.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{item.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{item.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <p className="font-medium">{item.size}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Condition:</span>
                        <p className="font-medium">{item.condition}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Points Value:</span>
                        <p className="font-medium flex items-center gap-1">
                          <Award className="h-4 w-4 text-primary" />
                          {item.points} pts
                        </p>
                      </div>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* FR4.2 - Uploader Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Item Owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.user_id.avatar_url} />
                      <AvatarFallback>
                        {(item.user_id.full_name || item.user_id.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.user_id.full_name || item.user_id.username}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {item.user_id.points} points
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* FR4.4 - Conditional Actions */}
              <div className="space-y-3">
                {isOwner ? (
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Item
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={handleDeleteItem}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Item
                    </Button>
                  </div>
                ) : canSwap ? (
                  <div className="space-y-3">
                    {/* FR4.5 - Swap Request Modal */}
                    <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          size="lg"
                          disabled={!hasAvailableItems}
                        >
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                          Request Swap
                          {!hasAvailableItems && " (No items to offer)"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Request Swap for {item.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {hasAvailableItems ? (
                            <>
                              <div>
                                <label className="text-sm font-medium">Select Item to Offer</label>
                                <select
                                  value={selectedItemId}
                                  onChange={(e) => setSelectedItemId(e.target.value)}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                                >
                                  <option value="">Choose an item...</option>
                                  {userItems.map((userItem) => (
                                    <option key={userItem._id} value={userItem._id}>
                                      {userItem.title} ({userItem.category}, {userItem.size})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Additional Points to Offer (Optional)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={pointsOffered}
                                  onChange={(e) => setPointsOffered(parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Message to Owner</label>
                                <Textarea
                                  value={swapMessage}
                                  onChange={(e) => setSwapMessage(e.target.value)}
                                  placeholder="Tell the owner why you'd like to swap for this item..."
                                  rows={4}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground mb-2">
                                You have no available items to offer for a swap.
                              </p>
                              <p className="text-sm text-muted-foreground">
                                You can still redeem with points or list a new item.
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowSwapDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSwapRequest}
                              disabled={isSubmittingSwap || !hasAvailableItems}
                              className="flex-1"
                            >
                              {isSubmittingSwap ? "Sending..." : "Send Request"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* FR4.6 - Redeem via Points Logic */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              className="w-full" 
                              size="lg"
                              variant="outline"
                              disabled={!canRedeem}
                              onClick={() => setShowRedeemDialog(true)}
                            >
                              <Award className="h-4 w-4 mr-2" />
                              Redeem with Points ({item.points} pts)
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!canRedeem && (
                          <TooltipContent>
                            <p>You need {item.points} points to redeem this item. You have {user?.points || 0} points.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {/* Redeem Confirmation Dialog */}
                    <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Redeem Item with Points</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">
                            Are you sure you want to redeem "{item.title}" for {item.points} points?
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your current balance: {user?.points} points
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowRedeemDialog(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleRedeemWithPoints}
                              disabled={isSubmittingRedeem}
                              className="flex-1"
                            >
                              {isSubmittingRedeem ? "Processing..." : "Confirm Redemption"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      {!user ? "Please log in to request a swap" : 
                       !isAvailable ? "This item is not available for swapping" :
                       "You cannot swap your own item"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Similar Items Section */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Similar Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* This would be populated with similar items from the API */}
              <div className="text-center text-muted-foreground py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Similar items will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItemDetail;
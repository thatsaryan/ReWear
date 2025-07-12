import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usersAPI, swapsAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Package, 
  ArrowLeftRight, 
  Plus, 
  TrendingUp, 
  Award,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  History
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface UserStats {
  itemsListed: number;
  availableItems: number;
  swappedItems: number;
  pendingItems: number;
  successfulSwaps: number;
  totalPointsEarned: number;
  co2Saved: number;
}

interface Item {
  _id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  size: string;
  condition: string;
  points: number;
  status: string;
  likes: number;
  views: number;
  createdAt: string;
}

interface Swap {
  _id: string;
  item_id: {
    _id: string;
    title: string;
    image_url: string;
    status?: string;
    user_id?: {
      _id: string;
      username: string;
      full_name: string;
    };
  };
  requester_id: {
    _id: string;
    username: string;
    full_name: string;
  };
  status: string;
  points_offered: number;
  message: string;
  createdAt: string;
}

const Dashboard = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<{ user: any; stats: UserStats } | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [incomingSwaps, setIncomingSwaps] = useState<Swap[]>([]);
  const [outgoingSwaps, setOutgoingSwaps] = useState<Swap[]>([]);
  const [completedSwaps, setCompletedSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingSwap, setProcessingSwap] = useState<string | null>(null);

  // FR3.1 - Access Control: Redirect if not logged in
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [dashboardResponse, itemsData, incomingData, outgoingData, completedData] = await Promise.all([
          usersAPI.getDashboard(token),
          usersAPI.getItems(token),
          usersAPI.getIncomingSwaps(token),
          usersAPI.getOutgoingSwaps(token),
          usersAPI.getCompletedSwaps(token)
        ]);

        setDashboardData(dashboardResponse);
        setUserItems(itemsData);
        setIncomingSwaps(incomingData);
        setOutgoingSwaps(outgoingData);
        setCompletedSwaps(completedData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleAcceptSwap = async (swapId: string) => {
    if (!token) return;
    
    try {
      setProcessingSwap(swapId);
      await swapsAPI.accept(swapId, token);
      
      // Refresh the swaps data
      const [incomingData, outgoingData, completedData] = await Promise.all([
        usersAPI.getIncomingSwaps(token),
        usersAPI.getOutgoingSwaps(token),
        usersAPI.getCompletedSwaps(token)
      ]);
      
      setIncomingSwaps(incomingData);
      setOutgoingSwaps(outgoingData);
      setCompletedSwaps(completedData);
      
      toast({
        title: "Success",
        description: "Swap request accepted successfully!",
      });
    } catch (error) {
      console.error('Error accepting swap:', error);
      toast({
        title: "Error",
        description: "Failed to accept swap request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingSwap(null);
    }
  };

  const handleDeclineSwap = async (swapId: string) => {
    if (!token) return;
    
    try {
      setProcessingSwap(swapId);
      await swapsAPI.reject(swapId, token);
      
      // Refresh the swaps data
      const [incomingData, outgoingData] = await Promise.all([
        usersAPI.getIncomingSwaps(token),
        usersAPI.getOutgoingSwaps(token)
      ]);
      
      setIncomingSwaps(incomingData);
      setOutgoingSwaps(outgoingData);
      
      toast({
        title: "Success",
        description: "Swap request declined successfully.",
      });
    } catch (error) {
      console.error('Error declining swap:', error);
      toast({
        title: "Error",
        description: "Failed to decline swap request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingSwap(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'swapped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSwapStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* FR3.2 - Profile Details Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {dashboardData?.user?.full_name || user?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your sustainable fashion journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-foreground">{dashboardData?.user?.points || 0}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Items Listed</p>
                  <p className="text-2xl font-bold text-foreground">{dashboardData?.stats?.itemsListed || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful Swaps</p>
                  <p className="text-2xl font-bold text-foreground">{dashboardData?.stats?.successfulSwaps || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CO₂ Saved</p>
                  <p className="text-2xl font-bold text-foreground">{dashboardData?.stats?.co2Saved || 0}kg</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items">My Items</TabsTrigger>
            <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing Requests</TabsTrigger>
            <TabsTrigger value="history">Swap History</TabsTrigger>
          </TabsList>

          {/* FR3.3 - Uploaded Items Overview Tab */}
          <TabsContent value="items" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Listed Items</h2>
              <Link to="/add-item">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </Link>
            </div>

            {userItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No items listed yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your sustainable fashion journey by listing your first item
                  </p>
                  <Link to="/add-item">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      List Your First Item
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userItems.map((item) => (
                  <Card key={item._id} className="overflow-hidden">
                    <div className="aspect-square bg-muted">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{item.category} • {item.size}</span>
                        <span>{item.points} pts</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>❤️ {item.likes} • 👁️ {item.views}</span>
                        <Link to={`/item/${item._id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FR3.4 - Incoming Requests Tab */}
          <TabsContent value="incoming" className="space-y-6">
            <h2 className="text-xl font-semibold">Incoming Swap Requests</h2>
            
            {incomingSwaps.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No incoming swap requests yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    When other users request your items, they'll appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {incomingSwaps.map((swap) => (
                  <Card key={swap._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {swap.item_id.image_url ? (
                            <img 
                              src={swap.item_id.image_url} 
                              alt={swap.item_id.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{swap.item_id.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Requested by {swap.requester_id.full_name || swap.requester_id.username}
                          </p>
                          {swap.points_offered > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {swap.points_offered} points offered
                            </p>
                          )}
                          {swap.message && (
                            <p className="text-xs text-muted-foreground mt-1">
                              "{swap.message}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(swap.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSwapStatusColor(swap.status)}>
                            {swap.status}
                          </Badge>
                          {swap.status === 'pending' && (
                            <div className="mt-2 space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleAcceptSwap(swap._id)}
                                disabled={processingSwap === swap._id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingSwap === swap._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeclineSwap(swap._id)}
                                disabled={processingSwap === swap._id}
                              >
                                {processingSwap === swap._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FR3.4 - Outgoing Requests Tab */}
          <TabsContent value="outgoing" className="space-y-6">
            <h2 className="text-xl font-semibold">Outgoing Swap Requests</h2>
            
            {outgoingSwaps.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No outgoing swap requests yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <Link to="/browse" className="text-primary hover:underline">
                      Browse items
                    </Link> to start making swap requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {outgoingSwaps.map((swap) => (
                  <Card key={swap._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {swap.item_id.image_url ? (
                            <img 
                              src={swap.item_id.image_url} 
                              alt={swap.item_id.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{swap.item_id.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Owner: {swap.item_id.user_id?.full_name || swap.item_id.user_id?.username}
                          </p>
                          {swap.points_offered > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {swap.points_offered} points offered
                            </p>
                          )}
                          {swap.message && (
                            <p className="text-xs text-muted-foreground mt-1">
                              "{swap.message}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(swap.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getSwapStatusColor(swap.status)}>
                            {swap.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FR3.5 - Completed Swaps Tab */}
          <TabsContent value="history" className="space-y-6">
            <h2 className="text-xl font-semibold">Swap History</h2>
            
            {completedSwaps.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No completed swaps yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your completed swaps will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedSwaps.map((swap) => (
                  <Card key={swap._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {swap.item_id.image_url ? (
                            <img 
                              src={swap.item_id.image_url} 
                              alt={swap.item_id.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{swap.item_id.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {swap.requester_id._id === user?.id ? (
                              <>You swapped with {swap.item_id.user_id?.full_name || swap.item_id.user_id?.username}</>
                            ) : (
                              <>Swapped with {swap.requester_id.full_name || swap.requester_id.username}</>
                            )}
                          </p>
                          {swap.points_offered > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {swap.points_offered} points exchanged
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Completed on {new Date(swap.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
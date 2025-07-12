import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Package, 
  Check, 
  X, 
  AlertTriangle,
  Users,
  BarChart3,
  Trash2,
  Ban,
  Award,
  Search,
  Eye,
  EyeOff
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

interface Item {
  _id: string;
  title: string;
  description: string;
  images: string[];
  image_url: string;
  category: string;
  type: string;
  size: string;
  condition: string;
  points: number;
  status: string;
  rejection_reason?: string;
  createdAt: string;
  user_id: {
    _id: string;
    username: string;
    full_name: string;
    email: string;
    points: number;
  };
}

interface User {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  points: number;
  level: string;
  role: string;
  is_banned: boolean;
  ban_reason?: string;
  banned_at?: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  totalSwaps: number;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [removalReason, setRemovalReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [pointsAdjustment, setPointsAdjustment] = useState({ amount: 0, reason: "" });

  // FR6.1 - Admin Panel Access: Redirect if not admin
  if (!user || !token || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchTerm, token]);

  const fetchData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      if (activeTab === "pending") {
        const items = await adminAPI.getPendingItems(token);
        setPendingItems(items);
      } else if (activeTab === "users") {
        const response = await adminAPI.getUsers({ 
          page: currentPage, 
          limit: 20, 
          search: searchTerm 
        }, token);
        setUsers(response.users);
        setTotalPages(response.pagination.pages);
      } else if (activeTab === "stats") {
        const statsData = await adminAPI.getStats(token);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // FR6.3 - Approve item
  const handleApproveItem = async (item: Item) => {
    try {
      await adminAPI.approveItem(item._id, token);
      setPendingItems(prev => prev.filter(i => i._id !== item._id));
      toast({
        title: "Success",
        description: `Item "${item.title}" approved successfully`,
      });
    } catch (error) {
      console.error('Error approving item:', error);
      toast({
        title: "Error",
        description: "Failed to approve item",
        variant: "destructive",
      });
    }
  };

  // FR6.3 - Reject item
  const handleRejectItem = async (item: Item) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAPI.rejectItem(item._id, rejectionReason, token);
      setPendingItems(prev => prev.filter(i => i._id !== item._id));
      setRejectionReason("");
      setSelectedItem(null);
      toast({
        title: "Success",
        description: `Item "${item.title}" rejected successfully`,
      });
    } catch (error) {
      console.error('Error rejecting item:', error);
      toast({
        title: "Error",
        description: "Failed to reject item",
        variant: "destructive",
      });
    }
  };

  // FR6.4 - Remove item
  const handleRemoveItem = async (item: Item) => {
    if (!removalReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for removal",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAPI.removeItem(item._id, removalReason, token);
      setPendingItems(prev => prev.filter(i => i._id !== item._id));
      setRemovalReason("");
      setSelectedItem(null);
      toast({
        title: "Success",
        description: `Item "${item.title}" removed successfully`,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  // FR6.5 - Ban/unban user
  const handleBanUser = async (user: User, banned: boolean) => {
    if (banned && !banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for banning",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAPI.banUser(user._id, banned, banReason, token);
      setUsers(prev => prev.map(u => 
        u._id === user._id 
          ? { ...u, is_banned: banned, ban_reason: banned ? banReason : undefined }
          : u
      ));
      setBanReason("");
      setSelectedUser(null);
      toast({
        title: "Success",
        description: `User ${user.username} ${banned ? 'banned' : 'unbanned'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update user ban status",
        variant: "destructive",
      });
    }
  };

  // FR6.5 - Adjust user points
  const handleAdjustPoints = async (user: User) => {
    if (!pointsAdjustment.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for point adjustment",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAPI.adjustUserPoints(user._id, pointsAdjustment.amount, pointsAdjustment.reason, token);
      setUsers(prev => prev.map(u => 
        u._id === user._id 
          ? { ...u, points: u.points + pointsAdjustment.amount }
          : u
      ));
      setPointsAdjustment({ amount: 0, reason: "" });
      setSelectedUser(null);
      toast({
        title: "Success",
        description: `Points adjusted for ${user.username} successfully`,
      });
    } catch (error) {
      console.error('Error adjusting user points:', error);
      toast({
        title: "Error",
        description: "Failed to adjust user points",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Moderate and manage community content
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingItems}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Swaps</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalSwaps}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending Review ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              User Management
            </TabsTrigger>
            <TabsTrigger value="stats">
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* FR6.2 - Pending Items Queue */}
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading items...</p>
              </div>
            ) : pendingItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending items</h3>
                  <p className="text-muted-foreground">All items have been reviewed!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>{item.category} • {item.type} • {item.size} • {item.condition}</span>
                            <span>{item.points} pts</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Listed by {item.user_id.username} • {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveItem(item)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItem(item)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Item</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection-reason">Reason for rejection</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a reason for rejecting this item..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleRejectItem(item)}
                                    variant="destructive"
                                  >
                                    Reject Item
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRejectionReason("");
                                      setSelectedItem(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove Item</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="removal-reason">Reason for removal</Label>
                                  <Textarea
                                    id="removal-reason"
                                    value={removalReason}
                                    onChange={(e) => setRemovalReason(e.target.value)}
                                    placeholder="Please provide a reason for removing this item..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleRemoveItem(item)}
                                    variant="destructive"
                                  >
                                    Remove Item
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRemovalReason("");
                                      setSelectedItem(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FR6.5 - User Management */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{user.username}</h3>
                              {user.role === 'admin' && (
                                <Badge variant="default">Admin</Badge>
                              )}
                              {user.is_banned && (
                                <Badge variant="destructive">Banned</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.full_name} • {user.points} pts • {user.level}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.is_banned ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Unban
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Unban User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to unban {user.username}?</p>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleBanUser(user, false)}
                                      variant="default"
                                    >
                                      Unban User
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedUser(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ban User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="ban-reason">Reason for ban</Label>
                                    <Textarea
                                      id="ban-reason"
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                      placeholder="Please provide a reason for banning this user..."
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleBanUser(user, true)}
                                      variant="destructive"
                                    >
                                      Ban User
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setBanReason("");
                                        setSelectedUser(null);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                Points
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Points</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="points-amount">Points adjustment</Label>
                                  <Input
                                    id="points-amount"
                                    type="number"
                                    value={pointsAdjustment.amount}
                                    onChange={(e) => setPointsAdjustment(prev => ({
                                      ...prev,
                                      amount: parseInt(e.target.value) || 0
                                    }))}
                                    placeholder="Enter points (positive or negative)"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="points-reason">Reason</Label>
                                  <Textarea
                                    id="points-reason"
                                    value={pointsAdjustment.reason}
                                    onChange={(e) => setPointsAdjustment(prev => ({
                                      ...prev,
                                      reason: e.target.value
                                    }))}
                                    placeholder="Please provide a reason for this adjustment..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAdjustPoints(user)}
                                  >
                                    Adjust Points
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setPointsAdjustment({ amount: 0, reason: "" });
                                      setSelectedUser(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-semibold">{stats.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Swaps:</span>
                      <span className="font-semibold">{stats.totalSwaps}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Item Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Pending Review:</span>
                      <span className="font-semibold text-yellow-600">{stats.pendingItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved:</span>
                      <span className="font-semibold text-green-600">{stats.approvedItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejected:</span>
                      <span className="font-semibold text-red-600">{stats.rejectedItems}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No statistics available</h3>
                  <p className="text-muted-foreground">Statistics will appear here once data is available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
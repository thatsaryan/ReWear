import { useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { itemsAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from "react-dropzone";
import DOMPurify from "dompurify";
import { 
  Upload, 
  X, 
  Package, 
  Camera,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", 
  "Accessories", "Bags", "Jewelry", "Activewear", "Formal"
];

const TYPES = [
  "Shirt", "T-Shirt", "Blouse", "Sweater", "Hoodie", "Jacket", "Coat",
  "Jeans", "Pants", "Shorts", "Skirt", "Dress", "Jumpsuit",
  "Sneakers", "Boots", "Sandals", "Heels", "Flats",
  "Hat", "Scarf", "Gloves", "Sunglasses", "Watch", "Necklace", "Earrings",
  "Backpack", "Handbag", "Wallet", "Tote", "Crossbody"
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

interface FormData {
  title: string;
  description: string;
  category: string;
  type: string;
  size: string;
  condition: string;
  points: number;
  tags: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  size?: string;
  condition?: string;
  points?: string;
  images?: string;
  tags?: string;
}

const AddItem = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    type: "",
    size: "",
    condition: "",
    points: 0,
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // FR5.1 - Access Control: Redirect if not logged in
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // FR5.3 - Form Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    // Description validation
    if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    // Size validation
    if (!formData.size) {
      newErrors.size = "Size is required";
    }

    // Condition validation
    if (!formData.condition) {
      newErrors.condition = "Condition is required";
    }

    // Points validation
    if (formData.points < 0) {
      newErrors.points = "Points must be 0 or greater";
    } else if (formData.points > 10000) {
      newErrors.points = "Points must be less than 10,000";
    }

    // Images validation
    if (images.length === 0) {
      newErrors.images = "At least one image is required";
    } else if (images.length > 5) {
      newErrors.images = "Maximum 5 images allowed";
    }

    // Tags validation
    if (formData.tags.length > 10) {
      newErrors.tags = "Maximum 10 tags allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FR5.2 - Multi-file upload with react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length + images.length > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  }, [images, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // FR5.3 - XSS Protection with DOMPurify
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addTag = () => {
    const sanitizedTag = sanitizeInput(tagInput.trim());
    if (sanitizedTag && !formData.tags.includes(sanitizedTag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, sanitizedTag]
      }));
      setTagInput("");
      setErrors(prev => ({ ...prev, tags: undefined }));
    } else if (formData.tags.length >= 10) {
      setErrors(prev => ({ ...prev, tags: "Maximum 10 tags allowed" }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // FR5.4 - Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();
      
      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Add form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('size', formData.size);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('points', formData.points.toString());
      formDataToSend.append('tags', JSON.stringify(formData.tags));

      await itemsAPI.create(formDataToSend, token);
      
      toast({
        title: "Success",
        description: "Item created successfully! It will be reviewed by our team.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">List a New Item</h1>
              <p className="text-muted-foreground">
                Share your pre-loved clothing with the community
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* FR5.2 - Multi-file Image Upload */}
                  <div>
                    <Label htmlFor="images">Item Photos *</Label>
                    <div className="mt-2">
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                          isDragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        {isDragActive ? (
                          <p className="text-primary">Drop the images here...</p>
                        ) : (
                          <>
                            <p className="text-muted-foreground mb-2">
                              Drag & drop images here, or click to select
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WebP up to 10MB each (max 5 images)
                            </p>
                          </>
                        )}
                      </div>
                      {errors.images && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.images}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Vintage Denim Jacket"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your item, including any unique features or styling tips..."
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Category and Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleInputChange('type', value)}
                      >
                        <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.type}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Size and Condition */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="size">Size *</Label>
                      <Select
                        value={formData.size}
                        onValueChange={(value) => handleInputChange('size', value)}
                      >
                        <SelectTrigger className={errors.size ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.size && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.size}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => handleInputChange('condition', value)}
                      >
                        <SelectTrigger className={errors.condition ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.condition && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.condition}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <div>
                    <Label htmlFor="points">Points Value *</Label>
                    <Input
                      id="points"
                      type="number"
                      min="0"
                      max="10000"
                      value={formData.points}
                      onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className={errors.points ? 'border-red-500' : ''}
                    />
                    {errors.points && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.points}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tags (e.g., vintage, sustainable)"
                        onKeyPress={handleKeyPress}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer">
                            {tag}
                            <X
                              className="h-3 w-3 ml-1"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    {errors.tags && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.tags}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Item...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        List Item
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.title ? (
                    <div className="space-y-4">
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {imagePreviews.slice(0, 4).map((preview, index) => (
                            <img
                              key={index}
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{formData.title}</h3>
                        {formData.description && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {formData.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{formData.category}</Badge>
                          <Badge variant="outline">{formData.type}</Badge>
                          <Badge variant="outline">{formData.size}</Badge>
                          <Badge variant="outline">{formData.condition}</Badge>
                          <Badge variant="default">{formData.points} pts</Badge>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start filling out the form to see a preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Better Listings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Take clear, well-lit photos from multiple angles</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Be honest about the condition of your item</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Include relevant tags to help others find your item</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Set reasonable point values based on condition and brand</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddItem;

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Search, TrendingUp, MessageSquare, Tag, Lightbulb, ExternalLink, Star, Calendar, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { QueryResult, QueryHistoryItem, CreateQueryInput, QueryType, Platform } from '../../server/src/schema';

function App() {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');

  // Form state for creating new queries
  const [formData, setFormData] = useState<CreateQueryInput>({
    input: '',
    query_type: 'keyword',
    platform: undefined,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  });

  // Load query history on component mount
  const loadQueryHistory = useCallback(async () => {
    try {
      const history = await trpc.getQueryHistory.query();
      setQueryHistory(history);
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  }, []);

  useEffect(() => {
    loadQueryHistory();
  }, [loadQueryHistory]);

  // Load specific query result
  const loadQueryResult = useCallback(async (queryId: string) => {
    if (!queryId) return;
    
    setIsLoading(true);
    try {
      const result = await trpc.getQuery.query(queryId);
      setQueryResult(result);
    } catch (error) {
      console.error('Failed to load query result:', error);
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query selection from history
  const handleQuerySelect = (queryId: string) => {
    setSelectedQueryId(queryId);
    loadQueryResult(queryId);
  };

  // Handle new query creation
  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newQuery = await trpc.createQuery.mutate(formData);
      await loadQueryHistory(); // Refresh history
      setSelectedQueryId(newQuery.id);
      await loadQueryResult(newQuery.id);
      
      // Reset form
      setFormData({
        input: '',
        query_type: 'keyword',
        platform: undefined,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Failed to create query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🔍 E-Commerce Intelligence Platform
          </h1>
          <p className="text-gray-600 text-lg">
            Analyze products, reviews, and market insights across multiple platforms
          </p>
        </div>

        {/* Query Creation Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Create New Analysis
            </CardTitle>
            <CardDescription>
              Start a new product or keyword analysis across e-commerce platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuery} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Enter product name, keyword, or URL..."
                    value={formData.input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateQueryInput) => ({ ...prev, input: e.target.value }))
                    }
                    required
                    className="text-lg py-6"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {isLoading ? '🔄 Analyzing...' : '🚀 Start Analysis'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  value={formData.query_type} 
                  onValueChange={(value: QueryType) => 
                    setFormData((prev: CreateQueryInput) => ({ ...prev, query_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">🔤 Keyword Search</SelectItem>
                    <SelectItem value="url">🔗 URL Analysis</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={formData.platform || 'all'} 
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateQueryInput) => ({ 
                      ...prev, 
                      platform: value === 'all' ? undefined : value as Platform 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 All Platforms</SelectItem>
                    <SelectItem value="shopee">🛍️ Shopee</SelectItem>
                    <SelectItem value="tiktok_shop">🎵 TikTok Shop</SelectItem>
                    <SelectItem value="tokopedia">🏪 Tokopedia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Query History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Query History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {queryHistory.length === 0 ? (
                    <p className="text-gray-500 p-4 text-center">No queries yet</p>
                  ) : (
                    queryHistory.map((query: QueryHistoryItem) => (
                      <div
                        key={query.id}
                        className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedQueryId === query.id ? 'bg-blue-100 border-blue-200' : ''
                        }`}
                        onClick={() => handleQuerySelect(query.id)}
                      >
                        <div className="font-medium text-sm truncate mb-1">
                          {query.input}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {query.query_type}
                          </Badge>
                          {query.platform && (
                            <Badge variant="outline" className="text-xs">
                              {query.platform}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {query.created_at.toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analysis results...</p>
                </CardContent>
              </Card>
            ) : queryResult ? (
              <div className="space-y-6">
                {/* Query Overview */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Analysis Overview
                      </CardTitle>
                      <Badge className={`${queryResult.query.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {queryResult.query.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Query: "{queryResult.query.input}" • Type: {queryResult.query.query_type}
                      {queryResult.query.platform && ` • Platform: ${queryResult.query.platform}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {queryResult.query.total_products_found}
                        </div>
                        <div className="text-sm text-gray-600">Products Found</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {queryResult.query.total_reviews_scraped}
                        </div>
                        <div className="text-sm text-gray-600">Reviews Analyzed</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {queryResult.query.average_rating?.toFixed(1) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Avg Rating</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {queryResult.keywords.length}
                        </div>
                        <div className="text-sm text-gray-600">Keywords</div>
                      </div>
                    </div>

                    {queryResult.query.sentiment_summary && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Sentiment Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Positive</span>
                            <span className="text-sm font-medium text-green-600">
                              {queryResult.query.sentiment_summary.positive}
                            </span>
                          </div>
                          <Progress 
                            value={(queryResult.query.sentiment_summary.positive / queryResult.query.total_reviews_scraped) * 100} 
                            className="h-2 bg-green-100"
                          />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Neutral</span>
                            <span className="text-sm font-medium text-gray-600">
                              {queryResult.query.sentiment_summary.neutral}
                            </span>
                          </div>
                          <Progress 
                            value={(queryResult.query.sentiment_summary.neutral / queryResult.query.total_reviews_scraped) * 100} 
                            className="h-2 bg-gray-100"
                          />
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Negative</span>
                            <span className="text-sm font-medium text-red-600">
                              {queryResult.query.sentiment_summary.negative}
                            </span>
                          </div>
                          <Progress 
                            value={(queryResult.query.sentiment_summary.negative / queryResult.query.total_reviews_scraped) * 100} 
                            className="h-2 bg-red-100"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tabbed Content */}
                <Tabs defaultValue="products" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="products" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Products ({queryResult.products.length})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Reviews ({queryResult.reviews.length})
                    </TabsTrigger>
                    <TabsTrigger value="keywords" className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Keywords ({queryResult.keywords.length})
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Insights ({queryResult.recommendations.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="products" className="space-y-4">
                    {queryResult.products.length === 0 ? (
                      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No products found for this query</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {queryResult.products.map((product) => (
                          <Card key={product.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                {product.image_url && (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                        {product.name}
                                      </h3>
                                      <div className="flex items-center gap-4 mb-3">
                                        <Badge variant="outline" className="capitalize">
                                          {product.platform.replace('_', ' ')}
                                        </Badge>
                                        {renderStars(product.average_rating)}
                                        <span className="text-sm text-gray-500">
                                          {product.total_reviews} reviews
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(product.price)}
                                      </div>
                                      <a
                                        href={product.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                                      >
                                        View Product <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4">
                    {queryResult.reviews.length === 0 ? (
                      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No reviews available</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {queryResult.reviews.map((review) => (
                          <Card key={review.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  {renderStars(review.rating)}
                                  <Badge className={getSentimentColor(review.sentiment)}>
                                    {review.sentiment || 'unanalyzed'}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.review_date.toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 leading-relaxed">
                                {review.review_text}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="keywords" className="space-y-4">
                    {queryResult.keywords.length === 0 ? (
                      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No keywords extracted</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {queryResult.keywords
                          .sort((a, b) => b.frequency - a.frequency)
                          .map((keyword) => (
                            <Card key={keyword.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-lg">
                                      {keyword.keyword}
                                    </span>
                                    <Badge className={getSentimentColor(keyword.sentiment_context)}>
                                      {keyword.sentiment_context}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-bold text-blue-600">
                                      {keyword.frequency}
                                    </span>
                                    <div className="text-sm text-gray-500">mentions</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    {queryResult.recommendations.length === 0 ? (
                      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No recommendations generated</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {queryResult.recommendations
                          .sort((a, b) => {
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                                   priorityOrder[a.priority as keyof typeof priorityOrder];
                          })
                          .map((recommendation) => (
                            <Card key={recommendation.id} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <h3 className="font-semibold text-lg">
                                    {recommendation.title}
                                  </h3>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge className={getPriorityColor(recommendation.priority)}>
                                      {recommendation.priority} priority
                                    </Badge>
                                    <span className="text-sm font-medium text-blue-600">
                                      Score: {recommendation.frequency_score.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-4 leading-relaxed">
                                  {recommendation.description}
                                </p>
                                {recommendation.related_keywords.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-600 mb-2 block">
                                      Related Keywords:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {recommendation.related_keywords.map((keyword: string, index: number) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Welcome to E-Commerce Intelligence
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Create a new analysis or select a query from your history to view detailed insights
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Product Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      Review Sentiment
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-500" />
                      Market Insights
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

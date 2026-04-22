import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Receipt, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Package,
  ChevronRight,
  Loader2,
  ShoppingBag,
  PieChart,
  ArrowUpRight,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface SaleRecord {
  id: string;
  listing_id: string;
  buyer_company: string;
  buyer_industry: string | null;
  categories_sold: string[];
  amount: number;
  platform_fee: number | null;
  net_amount: number;
  sold_at: string;
  created_at: string;
}

interface ListingInfo {
  id: string;
  title: string;
  status: string;
}

const categoryLabels: Record<string, string> = {
  consumption: "소비 패턴",
  financial: "금융 정보",
  health: "건강 데이터",
  location: "위치 정보",
  social: "소셜 활동",
  demographic: "인구통계",
};

const industryLabels: Record<string, string> = {
  finance: "금융/핀테크",
  retail: "유통/리테일",
  healthcare: "헬스케어",
  marketing: "마케팅/광고",
  research: "시장조사",
  insurance: "보험",
  tech: "IT/테크",
};

export function SaleHistoryDetail() {
  const { user } = useAuth();
  const [saleRecords, setSaleRecords] = useState<SaleRecord[]>([]);
  const [listings, setListings] = useState<Record<string, ListingInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<SaleRecord | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalNetAmount: 0,
    uniqueBuyers: 0,
  });

  useEffect(() => {
    if (user) {
      fetchSaleRecords();
    }
  }, [user]);

  const fetchSaleRecords = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch sale records
      const { data: records, error: recordsError } = await supabase
        .from("data_sale_records")
        .select("*")
        .eq("user_id", user.id)
        .order("sold_at", { ascending: false });

      if (recordsError) throw recordsError;

      // Fetch related listings
      const listingIds = [...new Set(records?.map(r => r.listing_id) || [])];
      if (listingIds.length > 0) {
        const { data: listingsData, error: listingsError } = await supabase
          .from("data_listings")
          .select("id, title, status")
          .in("id", listingIds);

        if (listingsError) throw listingsError;

        const listingsMap: Record<string, ListingInfo> = {};
        listingsData?.forEach(l => {
          listingsMap[l.id] = l;
        });
        setListings(listingsMap);
      }

      setSaleRecords(records || []);

      // Calculate stats
      if (records && records.length > 0) {
        const uniqueBuyers = new Set(records.map(r => r.buyer_company)).size;
        setStats({
          totalSales: records.length,
          totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
          totalNetAmount: records.reduce((sum, r) => sum + r.net_amount, 0),
          uniqueBuyers,
        });
      }
    } catch (error) {
      console.error("Failed to fetch sale records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryStats = () => {
    const categoryCount: Record<string, number> = {};
    saleRecords.forEach(record => {
      record.categories_sold.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getIndustryStats = () => {
    const industryCount: Record<string, number> = {};
    saleRecords.forEach(record => {
      if (record.buyer_industry) {
        industryCount[record.buyer_industry] = (industryCount[record.buyer_industry] || 0) + 1;
      }
    });
    return Object.entries(industryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (saleRecords.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">거래 내역이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            데이터 판매가 완료되면 여기에 거래 내역이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 거래</p>
                <p className="text-xl font-bold">{stats.totalSales}건</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 수익</p>
                <p className="text-xl font-bold">{stats.totalNetAmount.toLocaleString()} VN</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">구매 기업</p>
                <p className="text-xl font-bold">{stats.uniqueBuyers}곳</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <PieChart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 단가</p>
                <p className="text-xl font-bold">
                  {Math.round(stats.totalNetAmount / stats.totalSales || 0).toLocaleString()} VN
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Industry Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">인기 판매 카테고리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getCategoryStats().map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm">{categoryLabels[category] || category}</span>
                <Badge variant="secondary">{count}회</Badge>
              </div>
            ))}
            {getCategoryStats().length === 0 && (
              <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">주요 구매 산업</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getIndustryStats().map(([industry, count]) => (
              <div key={industry} className="flex items-center justify-between">
                <span className="text-sm">{industryLabels[industry] || industry}</span>
                <Badge variant="secondary">{count}회</Badge>
              </div>
            ))}
            {getIndustryStats().length === 0 && (
              <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            거래 상세 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>거래일</TableHead>
                  <TableHead>구매 기업</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">수익</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.sold_at), "MM.dd", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {record.buyer_company}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {record.categories_sold.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {categoryLabels[cat] || cat}
                          </Badge>
                        ))}
                        {record.categories_sold.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{record.categories_sold.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      +{record.net_amount.toLocaleString()} VN
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>거래 상세 정보</SheetTitle>
                          </SheetHeader>
                          {selectedRecord && (
                            <div className="mt-6 space-y-6">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                  <Building2 className="w-8 h-8 text-primary" />
                                  <div>
                                    <p className="font-semibold">{selectedRecord.buyer_company}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {industryLabels[selectedRecord.buyer_industry || ""] || selectedRecord.buyer_industry || "미분류"}
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">거래 일시</span>
                                    <span className="font-medium">
                                      {format(new Date(selectedRecord.sold_at), "yyyy.MM.dd HH:mm", { locale: ko })}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">연결된 판매</span>
                                    <span className="font-medium">
                                      {listings[selectedRecord.listing_id]?.title || "알 수 없음"}
                                    </span>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">판매된 카테고리</p>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedRecord.categories_sold.map((cat) => (
                                      <Badge key={cat} variant="secondary">
                                        {categoryLabels[cat] || cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">거래 금액</span>
                                    <span>{selectedRecord.amount.toLocaleString()} VN</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">플랫폼 수수료</span>
                                    <span className="text-destructive">
                                      -{(selectedRecord.platform_fee || 0).toLocaleString()} VN
                                    </span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">순수익</span>
                                    <span className="text-lg font-bold text-green-600">
                                      +{selectedRecord.net_amount.toLocaleString()} VN
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4">
                                <Button variant="outline" className="w-full" disabled>
                                  <ArrowUpRight className="w-4 h-4 mr-2" />
                                  영수증 다운로드 (준비중)
                                </Button>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

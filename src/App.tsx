import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import NotFound from "./pages/NotFound";
import ManageNovels from "./pages/novels/ManageNovels";
import CreateNovel from "./pages/novels/CreateNovel";
import EditNovel from "./pages/novels/EditNovel";
import ManageChapters from "./pages/novels/ManageChapters";
import CreateChapter from "./pages/novels/CreateChapter";
import EditChapter from "./pages/novels/EditChapter";
import NovelPage from "./pages/novels/NovelPage";
import ChapterPage from "./pages/novels/ChapterPage";
import Rankings from "./pages/rankings/Rankings";
import Browse from "./pages/Browse";
import Library from "./pages/Library";
import Genres from "./pages/Genres";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import StaticPage from "./pages/StaticPage";
import PurchaseCoins from "./pages/PurchaseCoins";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-20">
              <Routes>
                <Route path="/" element={<Index />} />
                
                {/* Auth routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                
                {/* Author/novel management routes */}
                <Route path="/author/novels" element={<ManageNovels />} />
                <Route path="/author/novels/create" element={<CreateNovel />} />
                <Route path="/author/novels/:novelId/edit" element={<EditNovel />} />
                <Route path="/author/novels/:novelId/chapters" element={<ManageChapters />} />
                <Route path="/author/novels/:novelId/chapters/create" element={<CreateChapter />} />
                <Route path="/author/novels/:novelId/chapters/:chapterId/edit" element={<EditChapter />} />
                
                {/* Reader routes */}
                <Route path="/novel/:novelId" element={<NovelPage />} />
                <Route path="/novel/:novelId/chapter/:chapterNumber" element={<ChapterPage />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/library" element={<Library />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                
                {/* Static pages */}
                <Route path="/:slug" element={<StaticPage />} />
                
                {/* Purchase coins route */}
                <Route path="/purchase-coins" element={<PurchaseCoins />} />
                
                {/* Catch all route for 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

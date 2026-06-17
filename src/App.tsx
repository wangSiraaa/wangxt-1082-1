import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import BookManagement from "@/pages/librarian/BookManagement";
import LoanManagement from "@/pages/librarian/LoanManagement";
import LoanSettings from "@/pages/librarian/LoanSettings";
import BookBrowse from "@/pages/parent/BookBrowse";
import MyLoans from "@/pages/parent/MyLoans";
import Checkins from "@/pages/parent/Checkins";
import OverdueManagement from "@/pages/admin/OverdueManagement";
import CompensationManagement from "@/pages/admin/CompensationManagement";
import Home from "@/pages/Home";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/librarian/books" element={<BookManagement />} />
          <Route path="/librarian/loans" element={<LoanManagement />} />
          <Route path="/librarian/settings" element={<LoanSettings />} />
          
          <Route path="/parent/browse" element={<BookBrowse />} />
          <Route path="/parent/loans" element={<MyLoans />} />
          <Route path="/parent/checkins" element={<Checkins />} />
          
          <Route path="/admin/overdue" element={<OverdueManagement />} />
          <Route path="/admin/compensations" element={<CompensationManagement />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

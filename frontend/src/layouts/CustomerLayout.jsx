import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ToastAlert from '../components/ToastAlert';

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden w-full max-w-full">
      <ToastAlert />
      <Navbar />
      <main className="flex-1 pb-24 md:pb-6 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default CustomerLayout;

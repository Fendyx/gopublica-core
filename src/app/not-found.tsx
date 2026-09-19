'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root-level 404 page — shown when no route matches at all.
 * Tenant-aware 404 is at [tenantDomain]/[locale]/not-found.tsx.
 */
export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="rounded-xl">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" /> Go to homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl" onClick={() => window.history.back()}>
            <span>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go back
            </span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

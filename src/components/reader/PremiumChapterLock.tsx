
import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumChapterLockProps {
  coinCost: number;
  onPurchaseClick: () => void;
}

const PremiumChapterLock = ({ coinCost, onPurchaseClick }: PremiumChapterLockProps) => {
  return (
    <div className="my-12 py-12 text-center">
      <div className="mb-6 flex justify-center">
        <Lock className="w-16 h-16 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Premium Chapter</h3>
      <p className="text-muted-foreground mb-6">
        This is a premium chapter that costs {coinCost} coins to unlock.
      </p>
      <Button onClick={onPurchaseClick}>
        Purchase for {coinCost} coins
      </Button>
    </div>
  );
};

export default PremiumChapterLock;

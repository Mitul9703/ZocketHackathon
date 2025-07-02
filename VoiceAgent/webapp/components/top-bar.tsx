import React from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const TopBar = () => {
  return (
    <div className="flex justify-between items-center px-6 py-4 border-b">
      <div className="flex items-center gap-4">
        <img src="https://s3-eu-west-1.amazonaws.com/tpd/logos/66975e45a28d00325aacb83e/0x0.png" alt="Zocket Logo" width={42} height={42} />
        <h1 className="text-xl font-semibold">Zocket Customerr Support Call Assistant</h1>
      </div>

    </div>
  );
};

export default TopBar;

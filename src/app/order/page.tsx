import Link from "next/link";
import { ArrowLeft, Mic } from "lucide-react";

export default function OrderPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-espresso-50">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tarro-200 text-tarro-700 mb-6">
          <Mic className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl text-espresso-900">
          Voice ordering
        </h1>
        <p className="mt-3 text-espresso-600">
          Conversational ordering and receipt will go here. Voice logic not built yet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-tarro-600 hover:text-tarro-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to menu
        </Link>
      </div>
    </div>
  );
}

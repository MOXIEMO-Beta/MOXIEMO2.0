import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WaitlistForm } from "@/components/WaitlistForm";
import { toast } from "sonner";

export default function Founding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      toast.message("You already have a MOXIE account.");
      navigate("/app");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="pt-16 md:pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-6 px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: "#ff6b6b" }}
          >
            Founding Members
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.035em] leading-[1.05] mb-6 text-foreground">
            Be a MOXIEMO Founding Member.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join the beta and lock in free platform access, forever. We are personally scheduling a 1:1 kickoff call with every founding member before granting platform access.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <WaitlistForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

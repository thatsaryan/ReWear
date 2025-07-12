import { Upload, Search, ArrowRightLeft, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "List Your Items",
    description: "Upload photos and details of clothes you want to exchange. Set your preferences and earn points.",
    step: "01"
  },
  {
    icon: Search,
    title: "Browse & Discover",
    description: "Explore amazing items from our community. Filter by size, style, and condition to find perfect matches.",
    step: "02"
  },
  {
    icon: ArrowRightLeft,
    title: "Request a Swap",
    description: "Found something you love? Send a swap request or use your earned points to redeem items directly.",
    step: "03"
  },
  {
    icon: Gift,
    title: "Enjoy Your New Style",
    description: "Complete the exchange and enjoy your new wardrobe addition while helping the environment!",
    step: "04"
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How ReWear Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our sustainable fashion community in just four simple steps. 
            It's easy, fun, and helps reduce textile waste.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative group hover:shadow-strong transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary/20">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-medium group-hover:scale-110 transition-transform duration-300">
                  {step.step}
                </div>

                <CardContent className="pt-8 pb-6 px-6 text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>

                {/* Connection Line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-primary/30 transform -translate-y-1/2"></div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-card rounded-2xl p-8 max-w-4xl mx-auto shadow-soft">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Start Your Sustainable Fashion Journey?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of eco-conscious fashion lovers who are making a difference, 
              one clothing swap at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-medium transition-all duration-300 hover:scale-105">
                Sign Up Now
              </button>
              <button className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
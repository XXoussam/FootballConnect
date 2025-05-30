import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { supabase, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";

const registerSchema = insertUserSchema.extend({
  fullName: z.string().min(2, "Full name is required"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormValues, "confirmPassword">) => {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.username, // Using username as email for auth
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });
      
      if (authError) throw new Error(authError.message);
      
      // After successful auth signup, create the profile data in the users table
      const { error: profileError } = await supabase.from('users').insert({
        username: data.username,
        full_name: data.fullName,
        id: authData.user?.id, // Use the user ID from Supabase Auth
      });
      
      if (profileError) throw new Error(profileError.message);
      
      return authData;
    },
    onSuccess: async () => {
      // Invalidate the currentUser query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      
      toast({
        title: "Registration successful",
        description: "Welcome to FootballConnect! Your account is ready.",
      });
      
      // Add a small delay before redirecting to ensure authentication is processed
      setTimeout(() => {
        navigate("/");
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">FL</div>
          </div>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join the professional football networking platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username/Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-neutral-500">
            Already have an account?{" "}
            <Link href="/login">
              <a className="text-primary hover:underline">Log in</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;

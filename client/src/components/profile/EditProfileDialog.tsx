import { useState } from "react";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { supabase, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Helper function to access properties that might be in different formats
const getProperty = (obj: any, camelCase: string, snakeCase: string) => {
  return obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase];
};

interface EditProfileDialogProps {
  user: User | any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define the form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().optional(),
  club: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  coverUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const EditProfileDialog = ({ user, open, onOpenChange }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Initialize form with current user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: getProperty(user, "fullName", "full_name") || "",
      position: user.position || "",
      club: user.club || "",
      location: user.location || "",
      bio: user.bio || "",
      avatarUrl: getProperty(user, "avatarUrl", "avatar_url") || "",
      coverUrl: getProperty(user, "coverUrl", "cover_url") || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // Convert to snake_case for Supabase
      const supabaseData = {
        full_name: data.fullName,
        position: data.position,
        club: data.club,
        location: data.location,
        bio: data.bio,
        avatar_url: data.avatarUrl,
        cover_url: data.coverUrl,
      };
      
      console.log('📤 Sending profile update request to Supabase:', {
        userId: user.id,
        data: supabaseData
      });
      
      try {
        // Update the user profile directly in Supabase
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(supabaseData)
          .eq('id', user.id)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Supabase update error:', error);
          throw new Error(error.message);
        }
        
        console.log('📥 Profile update successful:', updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('❌ Profile update request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user data queries
      console.log('🔄 Invalidating queries and refreshing data');
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      });
      
      // Close the dialog
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('❌ Mutation error handler:', error);
      toast({
        title: "Update failed",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("avatarUrl", url);
    setAvatarPreview(url);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("coverUrl", url);
    setCoverPreview(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and photos
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Profile Picture</Label>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {(avatarPreview || getProperty(user, "avatarUrl", "avatar_url")) && (
                    <img 
                      src={avatarPreview || getProperty(user, "avatarUrl", "avatar_url")} 
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.src = ""}
                    />
                  )}
                </div>
                <Input 
                  id="avatarUrl"
                  placeholder="Enter image URL"
                  defaultValue={getProperty(user, "avatarUrl", "avatar_url") || ""}
                  onChange={handleAvatarChange}
                  className="flex-grow"
                />
              </div>
            </div>
            
            {/* Cover Photo */}
            <div className="space-y-2">
              <Label htmlFor="coverUrl">Cover Photo</Label>
              <div className="flex flex-col gap-2">
                <div className="w-full h-24 bg-gray-200 rounded-md overflow-hidden">
                  {(coverPreview || getProperty(user, "coverUrl", "cover_url")) && (
                    <img 
                      src={coverPreview || getProperty(user, "coverUrl", "cover_url")} 
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.src = ""}
                    />
                  )}
                </div>
                <Input 
                  id="coverUrl"
                  placeholder="Enter cover image URL"
                  defaultValue={getProperty(user, "coverUrl", "cover_url") || ""}
                  onChange={handleCoverChange}
                />
              </div>
            </div>
            
            {/* Full Name */}
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
            
            {/* Position */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Forward, Midfielder, Coach" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Club */}
            <FormField
              control={form.control}
              name="club"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club</FormLabel>
                  <FormControl>
                    <Input placeholder="Your current club" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about yourself..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
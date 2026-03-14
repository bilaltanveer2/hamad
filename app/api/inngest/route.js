import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { deleteCouponOnExpiry, syncUserCreation, syncUserDeletion, syncUserupdation } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncUserCreation, syncUserupdation, syncUserDeletion,
    deleteCouponOnExpiry
  ],
});


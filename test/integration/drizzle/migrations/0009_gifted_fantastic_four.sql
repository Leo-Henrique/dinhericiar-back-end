ALTER TABLE "transaction_recurrences" DROP CONSTRAINT "type_constraint";--> statement-breakpoint
ALTER TABLE "transaction_recurrences" ADD CONSTRAINT "type_constraint" CHECK (
        (
          "transaction_recurrences"."type" = 'INSTALLMENT' 
        AND 
          "transaction_recurrences"."installments" IS NOT NULL
        AND 
          "transaction_recurrences"."interval" IS NULL
        AND 
          "transaction_recurrences"."occurrences" IS NULL
        ) 
        OR (
          "transaction_recurrences"."type" = 'FIXED'
        AND 
          "transaction_recurrences"."installments" IS NULL
        AND 
          "transaction_recurrences"."interval" IS NOT NULL
        )
      );
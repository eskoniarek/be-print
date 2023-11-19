// Inside src/admin/components/product-media/CreateForm/index.tsx

import React, { useState } from "react";
import { MediaType } from "../../../../models/product-media";
import {
  useAdminCreateProduct,
  useAdminCustomPost,
  useAdminUploadProtectedFile,
} from "medusa-react";
import {
  CreateProductMediaRequest,
  CreateProductMediaResponse,
} from "../../../../types/product-media";
import { Button, Container, Input, Label } from "@medusajs/ui";
import { RouteProps } from "@medusajs/admin-ui";
import { useNavigate } from "react-router-dom";

const ProductMediaCreateForm = ({ notify }: RouteProps) => {
  const [productName, setProductName] = useState("");
  const [variants] = useState([
    { name: "A0", type: "main", file: null, prices: [5000, 5000], quantity: 10000 },
    { name: "A1", type: "main", file: null, prices: [4000, 4000], quantity: 10000 },
    { name: "A2", type: "main", file: null, prices: [3000, 3000], quantity: 10000 },
    { name: "A3", type: "main", file: null, prices: [2000, 2000], quantity: 10000 },
  ]);

  const createProduct = useAdminCreateProduct();
  const uploadFile = useAdminUploadProtectedFile();
  const {
    mutate: createDigitalProduct,
    status,
  } = useAdminCustomPost<CreateProductMediaRequest, CreateProductMediaResponse>(
    "/product-media",
    ["product-media"]
  );

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const productVariantsData = variants.map((variant) => ({
      title: variant.name,
      options: [
        {
          value: variant.name,
        },
      ],
      prices: variant.prices.map((amount, index) => ({
        currency_code: index === 0 ? "EUR" : "USD",
        amount: parseFloat(amount.toFixed(2)),
      })),
      inventory_quantity: variant.quantity, // Include the quantity property
    }));

    const { product } = await createProduct.mutateAsync({
      title: productName,
      is_giftcard: false,
      discountable: false,
      options: [
        {
          title: "Digital Product",
        },
      ],
      variants: productVariantsData,
    });

    for (let index = 0; index < variants.length; index++) {
      const variant = variants[index];

      if (!variant.file) {
        // Handle case where file is not selected for a variant
        continue;
      }

      const { uploads } = await uploadFile.mutateAsync(variant.file);

      if (!uploads || uploads.length === 0 || !("key" in uploads[0])) {
        return;
      }

      await createDigitalProduct({
        variant_ids: [product.variants[index].id],
        name: variant.name,
        file_key: uploads[0].key as string,
        type: variant.type as MediaType,
        mime_type: variant.file.type,
      });
    }

    notify.success("Success", "Digital Products Created Successfully");
    navigate("/a/product-media");
  };

  return (
    <Container>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <Label>Product Name</Label>
          <Input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        {variants.map((variant, index) => (
          <div key={index} className="flex gap-4 items-center">
            <Label>{`Variant ${index + 1} Name`}</Label>
            <Input
              type="text"
              placeholder={`Variant ${index + 1} Name`}
              value={variant.name}
              onChange={(e) => {
                // You can choose to update the name if needed
              }}
            />
            <Label>{`Variant ${index + 1} File`}</Label>
            <Input
              type="file"
              onChange={(e) => {
                // You can choose to handle file changes if needed
              }}
            />
          </div>
        ))}
        <Button
          variant="primary"
          type="submit"
          isLoading={
            createProduct.status === "pending" ||
            uploadFile.status === "pending" ||
            status === "pending"
          }
        >
          Create
        </Button>
      </form>
    </Container>
  );
};

export default ProductMediaCreateForm;

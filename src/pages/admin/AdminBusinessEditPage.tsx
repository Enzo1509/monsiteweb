import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { useBusinessMutations } from '@/hooks/useBusinessMutations';
import { useBusinessStore } from '@/store/businessStore';
import { getGooglePlaceDetails, extractPlaceIdFromUrl } from '@/lib/googlePlaces';
import type { Business, BusinessCategory } from '@/types/business';

const businessSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    icon: z.string(),
  }),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, 'La ville est requise'),
  googleMapsUrl: z.string().optional(),
});

type BusinessForm = z.infer<typeof businessSchema>;

const categories: BusinessCategory[] = [
  { id: '1', name: 'Garagiste', slug: 'garagiste', icon: 'car' },
  { id: '2', name: 'Coiffeur', slug: 'coiffeur', icon: 'scissors' },
  { id: '3', name: 'Restaurant', slug: 'restaurant', icon: 'utensils' },
];

const AdminBusinessEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const isNewBusiness = businessId === 'new';
  const { createBusiness, editBusiness } = useBusinessMutations();
  const businesses = useBusinessStore(state => state.businesses);
  const currentBusiness = businessId ? businesses.find(b => b.id === businessId) : null;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      category: categories[0],
      address: '',
      city: '',
      googleMapsUrl: '',
    },
  });

  // Pré-remplir le formulaire avec les données existantes
  useEffect(() => {
    if (currentBusiness) {
      reset({
        name: currentBusiness.name,
        category: currentBusiness.category,
        address: currentBusiness.address,
        city: currentBusiness.city,
        googleMapsUrl: currentBusiness.googleMapsUrl || '', // Ajout de l'URL Google Maps
      });
    }
  }, [currentBusiness, reset]);

  const googleMapsUrl = watch('googleMapsUrl');

  const onSubmit = async (data: BusinessForm) => {
    try {
      let rating = currentBusiness?.rating || 0;
      let totalReviews = currentBusiness?.totalReviews || 0;
      let reviews = currentBusiness?.reviews || [];

      if (data.googleMapsUrl) {
        const placeId = extractPlaceIdFromUrl(data.googleMapsUrl);
        if (placeId) {
          const placeDetails = await getGooglePlaceDetails(placeId);
          if (placeDetails) {
            rating = placeDetails.rating;
            totalReviews = placeDetails.user_ratings_total;
            reviews = placeDetails.reviews.map(review => ({
              id: crypto.randomUUID(),
              rating: review.rating,
              comment: review.text,
              author: review.author_name,
              date: new Date(review.time * 1000).toISOString(),
            }));
          }
        }
      }

      const businessData = {
        ...data,
        rating,
        totalReviews,
        reviews,
        services: currentBusiness?.services || [],
      };

      if (isNewBusiness) {
        await createBusiness.mutateAsync(businessData);
      } else if (businessId) {
        await editBusiness.mutateAsync({ ...businessData, id: businessId });
      }
      
      navigate('/admin/businesses');
    } catch (error) {
      console.error('Failed to save business:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">
        {isNewBusiness ? 'Nouvelle entreprise' : 'Modifier l\'entreprise'}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Catégorie
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  value={categories.findIndex(c => c.id === field.value.id)}
                  onChange={e => field.onChange(categories[parseInt(e.target.value)])}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {categories.map((category, index) => (
                    <option key={category.id} value={index}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              type="text"
              {...register('address')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ville
            </label>
            <input
              type="text"
              {...register('city')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL Google Maps
            </label>
            <input
              type="text"
              {...register('googleMapsUrl')}
              placeholder="https://maps.google.com/..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Collez l'URL de la fiche Google Maps pour importer automatiquement les avis
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || createBusiness.isPending || editBusiness.isPending}
            >
              {isSubmitting || createBusiness.isPending || editBusiness.isPending
                ? 'Enregistrement...'
                : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBusinessEditPage;
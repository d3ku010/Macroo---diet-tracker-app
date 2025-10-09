// Apollo Client setup for your diet tracker app
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: 'https://your-backend-api.com/graphql', // Your future backend
    cache: new InMemoryCache(),
    headers: {
        Authorization: 'Bearer YOUR_API_KEY',
    },
});

// GraphQL Schema Examples for your app
const FOOD_QUERIES = `
  # Search foods (replacing EDAMAM)
  type Query {
    searchFoods(
      query: String!
      limit: Int = 20
      offset: Int = 0
    ): FoodSearchResult!
    
    getFoodById(id: ID!): Food
    getUserMeals(userId: ID!, date: String!): [Meal!]!
    getUserProfile(userId: ID!): UserProfile
    getMealTemplates(userId: ID!): [MealTemplate!]!
  }

  # Mutations for data operations
  type Mutation {
    logFood(input: LogFoodInput!): FoodLog!
    createMealTemplate(input: MealTemplateInput!): MealTemplate!
    updateUserProfile(input: UserProfileInput!): UserProfile!
    logWaterIntake(userId: ID!, amount: Float!, timestamp: String!): WaterLog!
  }
`;

export { client, FOOD_QUERIES };

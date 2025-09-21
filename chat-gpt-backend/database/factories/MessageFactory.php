<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Chat;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $role = $this->faker->randomElement(['user', 'assistant', 'system']);
        
        return [
            'chat_id' => Chat::factory(),
            'user_id' => User::factory(),
            'role' => $role,
            'content' => $this->generateContentByRole($role),
            'metadata' => [
                'tokens' => $this->faker->numberBetween(10, 500),
                'model' => $this->faker->randomElement(['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']),
                'timestamp' => $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d H:i:s'),
            ],
            'is_edited' => $this->faker->boolean(10), // 10% chance of being edited
            'edited_at' => $this->faker->optional(0.1)->dateTimeBetween('-1 month', 'now'),
        ];
    }

    /**
     * Generate content based on the role.
     */
    private function generateContentByRole(string $role): string
    {
        return match ($role) {
            'user' => $this->faker->randomElement([
                'Hello, how are you?',
                'Can you help me with a coding problem?',
                'What is the weather like today?',
                'Explain quantum computing to me',
                'Write a poem about nature',
                'How do I learn a new language?',
                'What are the benefits of exercise?',
                'Tell me a joke',
                'What is artificial intelligence?',
                'How do I cook pasta?',
            ]),
            'assistant' => $this->faker->randomElement([
                'Hello! I\'m doing well, thank you for asking. How can I help you today?',
                'I\'d be happy to help you with your coding problem. What specific issue are you facing?',
                'I don\'t have access to real-time weather data, but I can help you find weather information online.',
                'Quantum computing is a fascinating field that uses quantum mechanical phenomena...',
                'Here\'s a poem about nature: [poem content]',
                'Learning a new language is a rewarding journey. Here are some effective strategies...',
                'Exercise has numerous benefits for both physical and mental health...',
                'Why don\'t scientists trust atoms? Because they make up everything!',
                'Artificial intelligence (AI) refers to the simulation of human intelligence in machines...',
                'Here\'s a simple way to cook pasta: [instructions]',
            ]),
            'system' => $this->faker->randomElement([
                'You are a helpful AI assistant.',
                'Please respond in a friendly and professional manner.',
                'Remember to be concise and clear in your responses.',
                'You are an expert in multiple fields and can help with various topics.',
                'Always prioritize user safety and provide accurate information.',
            ]),
            default => $this->faker->sentence(),
        };
    }

    /**
     * Indicate that the message is from a user.
     */
    public function user(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'user',
            'content' => $this->generateContentByRole('user'),
        ]);
    }

    /**
     * Indicate that the message is from an assistant.
     */
    public function assistant(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'assistant',
            'content' => $this->generateContentByRole('assistant'),
        ]);
    }

    /**
     * Indicate that the message is a system message.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'system',
            'content' => $this->generateContentByRole('system'),
        ]);
    }

    /**
     * Indicate that the message has been edited.
     */
    public function edited(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_edited' => true,
            'edited_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ]);
    }

    /**
     * Indicate that the message has specific content.
     */
    public function withContent(string $content): static
    {
        return $this->state(fn (array $attributes) => [
            'content' => $content,
        ]);
    }

    /**
     * Indicate that the message has specific metadata.
     */
    public function withMetadata(array $metadata): static
    {
        return $this->state(fn (array $attributes) => [
            'metadata' => array_merge($attributes['metadata'] ?? [], $metadata),
        ]);
    }
}

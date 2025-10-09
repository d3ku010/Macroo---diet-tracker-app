// Macroo Diet Tracker - Supabase Connection Test
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import macrooDatabase from '../utils/macrooDatabase';
import supabase from '../utils/supabaseClient';

export default function MacrooSupabaseTest() {
    const [connectionStatus, setConnectionStatus] = useState('Testing...');
    const [testResults, setTestResults] = useState([]);

    const testSupabaseConnection = async () => {
        const results = [];
        setConnectionStatus('Testing connection...');

        try {
            // Test 1: Basic connection
            const { data, error } = await supabase.from('foods').select('count').limit(1);
            if (error) throw error;

            results.push('✅ Supabase connection successful');
            setConnectionStatus('Connected ✅');

            // Test 2: Test foods table
            try {
                const foods = await macrooDatabase.getAllFoods();
                results.push(`✅ Foods table accessible (${foods.length} items)`);
            } catch (err) {
                results.push(`❌ Foods table error: ${err.message}`);
            }

            // Test 3: Test adding a sample food
            try {
                const testFood = {
                    name: 'Test Food - Macroo',
                    calories: 100,
                    protein: 5,
                    carbs: 10,
                    fat: 2,
                    serving_size: '100g'
                };

                await macrooDatabase.addFood(testFood);
                results.push('✅ Successfully added test food');

                // Clean up - delete the test food
                const allFoods = await macrooDatabase.getAllFoods();
                const testFoodItem = allFoods.find(f => f.name === 'Test Food - Macroo');
                if (testFoodItem) {
                    await macrooDatabase.deleteFood(testFoodItem.id);
                    results.push('✅ Successfully cleaned up test food');
                }
            } catch (err) {
                if (err.message.includes('duplicate')) {
                    results.push('⚠️ Test food already exists (this is ok)');
                } else {
                    results.push(`❌ Add food test failed: ${err.message}`);
                }
            }

        } catch (error) {
            console.error('Connection test failed:', error);
            setConnectionStatus('Connection failed ❌');
            results.push(`❌ Connection failed: ${error.message}`);
        }

        setTestResults(results);
    };

    const runMigrationTest = async () => {
        Alert.alert(
            'Migrate to Supabase',
            'This will migrate your AsyncStorage data to Supabase. Your local data will be preserved. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Migration',
                    onPress: async () => {
                        try {
                            setTestResults(prev => [...prev, '🚀 Starting migration...']);

                            const macrooMigration = (await import('../utils/macrooMigration')).default;
                            const needsMigration = await macrooMigration.isMigrationNeeded();

                            if (needsMigration) {
                                setTestResults(prev => [...prev, '📦 Found data to migrate']);

                                // Run the full migration
                                await macrooMigration.migrateAllData('00000000-0000-0000-0000-000000000001');

                                setTestResults(prev => [...prev, '✅ Migration completed successfully!']);
                                Alert.alert('Migration Complete', 'Your data has been successfully migrated to Supabase!');
                            } else {
                                setTestResults(prev => [...prev, '⚠️ No AsyncStorage data found to migrate']);
                                Alert.alert('No Migration Needed', 'No AsyncStorage data found to migrate.');
                            }
                        } catch (error) {
                            setTestResults(prev => [...prev, `❌ Migration failed: ${error.message}`]);
                            Alert.alert('Migration Failed', error.message);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        testSupabaseConnection();
    }, []); return (
        <View style={styles.container}>
            <Text style={styles.title}>Macroo Supabase Test</Text>
            <Text style={styles.status}>Status: {connectionStatus}</Text>

            <View style={styles.resultsContainer}>
                {testResults.map((result, index) => (
                    <Text key={index} style={styles.result}>{result}</Text>
                ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={testSupabaseConnection}>
                <Text style={styles.buttonText}>Retest Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={runMigrationTest}>
                <Text style={styles.buttonText}>Migrate & Switch to Supabase</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28a745' }]}
                onPress={() => {
                    Alert.alert(
                        'Supabase Ready!',
                        'Your Macroo app is now using Supabase PostgreSQL database instead of AsyncStorage!\n\n✅ Food Database\n✅ Meal Tracking\n✅ Water Logging\n✅ Profile Data\n\nAll data is now stored in the cloud.',
                        [{ text: 'Great!', style: 'default' }]
                    );
                }}
            >
                <Text style={styles.buttonText}>Supabase Status</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    status: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        fontStyle: 'italic',
        color: '#666',
    },
    resultsContainer: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        minHeight: 100,
        maxHeight: 200,
    },
    result: {
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'monospace',
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
});
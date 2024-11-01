import { useUser, useAuth } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import RideCard from '@/components/RideCard';
import { icons, images } from '@/constants';
import GoogleTextInput from '@/components/GoogleTextInput';
import Map from '@/components/Map';
import { useLocationStore } from '@/store';
import * as Location from 'expo-location';
import { useFetch } from '@/lib/fetch';
import ReactNativeModal from 'react-native-modal';

export default function Page() {
  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { data: recentRides, loading } = useFetch(`/(api)/ride/${user?.id}`);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isSignOutClicked, setIsSignOutClicked] = useState(false);

  const handleSignOut = () => {
    setIsSignOutClicked(true);
  };
  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push('/(root)/find-ride');
  };

  useEffect(() => {
    const requestLoctaion = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setHasPermissions(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync();

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords?.latitude!,
        longitude: location.coords?.longitude!,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address[0].name}, ${address[0].region}`,
      });
    };
    requestLoctaion();
  }, [setUserLocation]);

  return (
    <SafeAreaView>
      <View className="bg-general-500">
        <ReactNativeModal isVisible={isSignOutClicked}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[100px]">
            <Text className="text-xl font-JakartaBold text-center">
              Do you want to sign out?
            </Text>
            <View className="flex flex-row items-center justify-between mx-10">
              <TouchableOpacity onPress={() => setIsSignOutClicked(false)}>
                <Text className=" text-xl font-JakartaBold">No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  signOut();
                  router.replace('/(auth)/sign-in');
                }}
                className="mt-5"
              >
                <Text className="font-JakartaBold text-xl">Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ReactNativeModal>
        <FlatList
          data={recentRides?.slice(0, 5)}
          renderItem={({ item }) => <RideCard ride={item} />}
          className="px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          ListEmptyComponent={() => (
            <View className="flex flex-col items-center justify-center">
              {!loading ? (
                <>
                  <Image
                    source={images.noResult}
                    className="w-40 h-40"
                    alt="No recent rides found"
                    resizeMode="contain"
                  />
                  <Text className="text-sm">No recent rides found</Text>
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color="#000" />
                  <Text>Loading..</Text>
                </>
              )}
            </View>
          )}
          ListHeaderComponent={() => (
            <>
              <View className="flex flex-row items-center justify-between my-5">
                <Text className="text-2xl font-JakartaBold capitalize">
                  Welcome{' '}
                  {user?.firstName ||
                    user?.emailAddresses[0].emailAddress.split('@')[0]}
                  👋
                </Text>
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="justify-center items-center w-10 h-10 rounded-full bg-white"
                >
                  <Image source={icons.out} className="w-4 h-4" />
                </TouchableOpacity>
              </View>
              <GoogleTextInput
                icon={icons.search}
                containerStyle="bg-white shadow-md shadow-neutral-300"
                handlePress={handleDestinationPress}
              />
              <>
                <Text className="text-xl font-JakartaBold mt-5 mb-3">
                  Your current Location
                </Text>
                <View className="flex flex-row items-center bg-transparent h-[300px]">
                  <Map />
                </View>
              </>
              <Text className="text-xl font-JakartaBold mt-5 mb-3">
                Recent Rides
              </Text>
            </>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

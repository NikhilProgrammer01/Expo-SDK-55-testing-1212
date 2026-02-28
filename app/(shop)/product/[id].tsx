// app/(shop)/product/[id].tsx
import AppHeader from '@/components/common/AppHeader';
import BrandFooter from '@/components/common/BrandFooter';
import { IMAGES } from '@/constants/images';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── CONSTANTS ───
const SIDE_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH = (width - (SIDE_PADDING * 2) - GRID_GAP) / 2;

interface Product {
  id: string; brand: string; name: string; price: string;
  colors: string[]; sizes: string[]; images: any[];
}
interface RelatedProduct {
  id: string; brand: string; name: string; price: string; image: any;
}

const PRODUCT: Product = {
  id: '1', brand: 'MOHAN', name: 'Recycle Boucle Knit Cardigan Pink', price: '$120',
  colors: ['#1a1a1a', '#c0392b', '#bdc3c7', '#e8dcc8'],
  sizes: ['S', 'M', 'L'],
  images: [IMAGES.newArrival1, IMAGES.newArrival2, IMAGES.newArrival3, IMAGES.newArrival4],
};

const RELATED: RelatedProduct[] = [
  { id: 'r1', brand: '21WN', name: 'reversible angora cardigan', price: '$120', image: IMAGES.justForYou1 },
  { id: 'r2', brand: 'lame', name: 'reversible angora cardigan', price: '$120', image: IMAGES.justForYou2 },
  { id: 'r3', brand: '21WN', name: 'reversible angora cardigan', price: '$120', image: IMAGES.justForYou1 },
  { id: 'r4', brand: 'lame', name: 'reversible angora cardigan', price: '$120', image: IMAGES.justForYou2 },
];

const CARE_ICONS = [
  { icon: 'ban-outline', label: 'Do not use bleach' },
  { icon: 'flash-off-outline', label: 'Do not tumble dry' },
  { icon: 'water-outline', label: 'Dry clean with tetrachloroethylene' },
  { icon: 'thermometer-outline', label: 'Iron at a maximum of 110ºC/230ºF' },
] as const;

// ─── COMPONENTS ───

function Accordion({ title, children, defaultOpen = false }: { title: string; children?: React.ReactNode; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);
  const toggle = () => {
    rotation.value = withTiming(open ? 0 : 1, { duration: 250 });
    setOpen((p) => !p);
  };
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 180}deg` }] }));
  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Animated.View style={arrowStyle}><Ionicons name="chevron-down-outline" size={18} color="#555" /></Animated.View>
      </TouchableOpacity>
      {open && children && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth(); 

  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  const openZoom = (index: number) => {
    setZoomIndex(index);
    translateY.value = 0;
    opacity.value = withTiming(1, { duration: 300 });
    setZoomVisible(true);
  };

  const closeZoom = () => {
    'worklet';
    opacity.value = withTiming(0, { duration: 200 }, () => { runOnJS(setZoomVisible)(false); });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => { if (event.translationY > 0) translateY.value = event.translationY; })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 600) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => { runOnJS(setZoomVisible)(false); });
      } else {
        translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }
    })
    .activeOffsetY([0, 20]) 
    .failOffsetX([-15, 15]);

  const animatedZoomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, SCREEN_HEIGHT * 0.4], [1, 0.5], Extrapolation.CLAMP),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 250], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <AppHeader />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }}>
          
          {/* IMAGE CAROUSEL */}
          <View style={[styles.carouselContainer, { marginTop: insets.top + 60 }]}>
            <TouchableOpacity activeOpacity={0.95} onPress={() => openZoom(activeSlide)}>
              <Image source={PRODUCT.images[activeSlide]} style={styles.carouselImage} contentFit="cover" transition={300} />
            </TouchableOpacity>
            <View style={styles.expandBtn} pointerEvents="none"><Ionicons name="expand-outline" size={18} color="#555" /></View>
            <TouchableOpacity style={styles.shareBtn}><Ionicons name="share-outline" size={20} color="#555" /></TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbContent}>
              {PRODUCT.images.map((src, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveSlide(i)} style={[styles.thumbWrapper, activeSlide === i && styles.thumbActive]}>
                  <Image source={src} style={styles.thumbImage} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ZOOM MODAL (RE-CENTERED & PULL-TO-DISMISS) */}
          <Modal visible={zoomVisible} transparent animationType="none" statusBarTranslucent onRequestClose={closeZoom}>
            <View style={styles.modalFull}>
              <Animated.View style={[styles.zoomBackdrop, backdropStyle]} />
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.zoomContent, animatedZoomStyle]}>
                  
                  <View style={[styles.zoomOverlay, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.dragHandle} />
                    <View style={styles.zoomTopBar}>
                      <Text style={styles.zoomCounter}>{zoomIndex + 1} / {PRODUCT.images.length}</Text>
                      <TouchableOpacity onPress={closeZoom} hitSlop={15}><Ionicons name="close-outline" size={32} color="#fff" /></TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView 
                    horizontal pagingEnabled showsHorizontalScrollIndicator={false} 
                    contentOffset={{ x: zoomIndex * width, y: 0 }}
                    onMomentumScrollEnd={(e) => setZoomIndex(Math.round(e.nativeEvent.contentOffset.x / width))} 
                    scrollEventThrottle={16}
                    style={StyleSheet.absoluteFill}
                    contentContainerStyle={{ alignItems: 'center' }}
                  >
                    {PRODUCT.images.map((src, i) => (
                      <View key={i} style={styles.zoomSlide}><Image source={src} style={styles.zoomImage} contentFit="contain" /></View>
                    ))}
                  </ScrollView>

                  <View style={[styles.zoomDots, { bottom: insets.bottom + 40 }]}>
                    {PRODUCT.images.map((_, i) => (
                      <View key={i} style={[styles.zoomDot, zoomIndex === i && styles.zoomDotActive]} />
                    ))}
                  </View>
                </Animated.View>
              </GestureDetector>
            </View>
          </Modal>

          {/* PRODUCT INFO */}
          <View style={styles.infoSection}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>{PRODUCT.brand}</Text>
              <TouchableOpacity onPress={() => setWishlist(!wishlist)}><Ionicons name={wishlist ? 'heart' : 'heart-outline'} size={22} color={wishlist ? '#dd8560' : '#aaa'} /></TouchableOpacity>
            </View>
            <Text style={styles.productName}>{PRODUCT.name}</Text>
            <Text style={styles.productPrice}>{PRODUCT.price}</Text>
            <View style={styles.divider} />

            <View style={styles.selectorRow}>
              <Text style={styles.selectorLabel}>Color</Text>
              <View style={styles.colorRow}>
                {PRODUCT.colors.map((color, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedColor(i)} style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === i && styles.colorSwatchActive]} />
                ))}
              </View>
            </View>

            <View style={styles.selectorRow}>
              <Text style={styles.selectorLabel}>Size</Text>
              <View style={styles.sizeRow}>
                {PRODUCT.sizes.map((size, i) => (
                  <TouchableOpacity key={size} onPress={() => setSelectedSize(i)} style={[styles.sizeBtn, selectedSize === i && styles.sizeBtnActive]}>
                    <Text style={[styles.sizeBtnText, selectedSize === i && styles.sizeBtnTextActive]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ADD TO BASKET */}
          <View style={styles.addToBasketContainer}>
            <TouchableOpacity style={styles.addToBasketBtn} activeOpacity={0.85} onPress={() => !isSignedIn && console.log('Clerk Auth Required')}>
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={styles.addToBasketText}>ADD TO BASKET</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWishlist(!wishlist)} style={styles.wishlistIconBtn}>
              <Ionicons name={wishlist ? 'heart' : 'heart-outline'} size={22} color={wishlist ? '#dd8560' : '#aaa'} />
            </TouchableOpacity>
          </View>

          {/* MATERIALS & CARE TEXT */}
          <View style={styles.descSection}>
            <Text style={styles.descHeading}>MATERIALS</Text>
            <Text style={styles.descBody}>We work with monitoring programmes to ensure compliance with safety, health and quality standards.</Text>
          </View>
          <View style={styles.descSection}>
            <Text style={styles.descHeading}>CARE</Text>
            <Text style={styles.descBody}>To keep your jackets and coats clean, you only need to freshen them up and go over them with a cloth or a clothes brush.</Text>
            {CARE_ICONS.map((item, i) => (
              <View key={i} style={styles.careIconRow}><Ionicons name={item.icon} size={18} color="#777" /><Text style={styles.careIconLabel}>{item.label}</Text></View>
            ))}
          </View>

          {/* ACCORDION SECTION (RESTORED CONTENT) */}
          <View style={styles.accordionSection}>
            <Accordion title="CARE" defaultOpen>
              <View style={styles.shippingRow}>
                <Ionicons name="cube-outline" size={18} color="#555" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.shippingTitleRow}>
                    <Text style={styles.shippingTitle}>Free Flat Rate Shipping</Text>
                  </View>
                  <Text style={styles.shippingSubtitle}>Estimated to be delivered on{"\n"}09/11/2021 - 12/11/2021.</Text>
                </View>
              </View>
            </Accordion>

            <Accordion title="COD Policy">
              <View style={styles.policyContent}>
                <View style={styles.policyRow}>
                  <Ionicons name="cash-outline" size={18} color="#555" />
                  <Text style={styles.policyText}>Cash on Delivery is available for orders up to <Text style={styles.policyBold}>$500</Text>.</Text>
                </View>
                <View style={styles.policyRow}>
                  <Ionicons name="location-outline" size={18} color="#555" />
                  <Text style={styles.policyText}>Available in selected cities. Enter your pincode at checkout to confirm availability.</Text>
                </View>
                <View style={styles.policyRow}>
                  <Ionicons name="time-outline" size={18} color="#555" />
                  <Text style={styles.policyText}>Please keep the exact amount ready at the time of delivery. Our delivery partner does not carry change.</Text>
                </View>
              </View>
            </Accordion>

            <Accordion title="Return Policy">
              <View style={styles.policyContent}>
                <View style={styles.policyRow}>
                  <Ionicons name="refresh-outline" size={18} color="#555" />
                  <Text style={styles.policyText}>Easy <Text style={styles.policyBold}>30-day returns</Text> from the date of delivery. Items must be unused and in original packaging.</Text>
                </View>
                <TouchableOpacity style={styles.policyLink}><Text style={styles.policyLinkText}>View full return policy →</Text></TouchableOpacity>
              </View>
            </Accordion>
          </View>

          {/* YOU MAY ALSO LIKE - SYMMETRICAL GRID */}
          <View style={styles.relatedSection}>
            <Text style={styles.relatedHeading}>YOU MAY ALSO LIKE</Text>
            <View style={styles.ornamentContainer}><View style={styles.ornamentLine} /><View style={styles.ornamentDiamond} /><View style={styles.ornamentLine} /></View>
            <View style={styles.relatedGrid}>
              {RELATED.map((item) => (
                <Pressable key={item.id} style={styles.relatedCard} onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}>
                  <Image source={item.image} style={styles.relatedImage} contentFit="cover" />
                  <Text style={styles.relatedBrand}>{item.brand}</Text>
                  <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.relatedPrice}>{item.price}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <BrandFooter showBenefits={false} />
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  carouselContainer: { width, backgroundColor: '#f7f5f2' },
  carouselImage: { width, height: 420 },
  expandBtn: { position: 'absolute', bottom: 98, left: 14, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 8 },
  shareBtn: { position: 'absolute', bottom: 98, right: 14, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 8 },
  thumbScroll: { marginTop: 10 },
  thumbContent: { paddingHorizontal: 14, gap: 8, paddingBottom: 12 },
  thumbWrapper: { width: 70, height: 70, borderRadius: 6, overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent' },
  thumbActive: { borderColor: '#111' },
  thumbImage: { width: '100%', height: '100%' },
  
  infoSection: { paddingHorizontal: 20, paddingTop: 20 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { fontSize: 12, letterSpacing: 2, color: '#888' },
  productName: { fontSize: 18, marginVertical: 8 },
  productPrice: { fontSize: 18, color: '#dd8560', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 15 },
  
  selectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 15 },
  selectorLabel: { fontSize: 13, color: '#555', width: 40 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 22, height: 22, borderRadius: 11 },
  colorSwatchActive: { borderWidth: 2, borderColor: '#fff', elevation: 3 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: { width: 36, height: 36, borderRadius: 4, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  sizeBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  sizeBtnText: { fontSize: 12 },
  sizeBtnTextActive: { color: '#fff' },
  
  addToBasketContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginVertical: 20 },
  addToBasketBtn: { flex: 1, height: 50, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addToBasketText: { color: '#fff', letterSpacing: 2, fontSize: 13 },
  wishlistIconBtn: { width: 50, height: 50, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  
  descSection: { paddingHorizontal: 20, paddingBottom: 20 },
  descHeading: { fontSize: 12, letterSpacing: 2, fontWeight: '600', marginBottom: 8 },
  descBody: { fontSize: 14, color: '#555', lineHeight: 20 },
  careIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  careIconLabel: { fontSize: 13, color: '#555' },

  accordionSection: { paddingHorizontal: 20 },
  accordion: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  accordionTitle: { fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },
  accordionBody: { paddingBottom: 15 },
  
  // --- RESTORED ACCORDION STYLES ---
  shippingRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FAFAFA', padding: 14, borderRadius: 4 },
  shippingTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  shippingTitle: { fontSize: 13, fontWeight: '500', color: '#111' },
  shippingSubtitle: { fontSize: 12, color: '#888', lineHeight: 18 },
  policyContent: { gap: 14 },
  policyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  policyText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  policyBold: { fontWeight: '600', color: '#111' },
  policyLink: { marginTop: 4 },
  policyLinkText: { fontSize: 13, color: '#dd8560' },

  relatedSection: { paddingTop: 40, alignItems: 'center' },
  relatedHeading: { fontSize: 14, letterSpacing: 4, marginBottom: 10 },
  ornamentContainer: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 24 },
  ornamentLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  ornamentDiamond: { width: 7, height: 7, borderWidth: 1, borderColor: '#CECECE', transform: [{ rotate: '45deg' }], marginHorizontal: 10 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', paddingHorizontal: SIDE_PADDING, justifyContent: 'space-between' },
  relatedCard: { width: CARD_WIDTH, marginBottom: 24 },
  relatedImage: { width: '100%', height: 200, backgroundColor: '#f9f9f9', marginBottom: 8 },
  relatedBrand: { fontSize: 10, letterSpacing: 1, color: '#999', textTransform: 'uppercase' },
  relatedName: { fontSize: 12, color: '#333', marginVertical: 4 },
  relatedPrice: { fontSize: 13, color: '#dd8560', fontWeight: '500' },

  // --- ZOOM MODAL STYLES ---
  modalFull: { flex: 1 },
  zoomBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  zoomContent: { flex: 1, backgroundColor: 'transparent' },
  zoomOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, alignSelf: 'center', marginBottom: 5 },
  zoomTopBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  zoomCounter: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  zoomSlide: { width, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  zoomImage: { width: width, height: SCREEN_HEIGHT * 0.85 },
  zoomDots: { position: 'absolute', flexDirection: 'row', justifyContent: 'center', alignSelf: 'center', gap: 8, zIndex: 10 },
  zoomDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  zoomDotActive: { backgroundColor: '#fff', width: 20 },
});
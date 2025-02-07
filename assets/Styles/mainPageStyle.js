import { StyleSheet } from 'react-native';

const styling = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    logo: {
      width: '100%',
      height: undefined,         
      aspectRatio: 2,             // this makes it centered, dont change it unless necessary
      resizeMode: 'contain',      
      marginBottom: 20
    },
  });

export default styling;
import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import Loading from './Loading'
import { hp } from '../helpers/common'
import PropTypes from "prop-types";

const Button = ({
    buttonStyle,
    textStyle,
    title='',
    onPress=()=>{},
    loading=false,
    hasShadow = true,
}) => {
    const shadowStyle = {
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 4
    }

    if(loading){
        return (
            <View style={[styles.button, buttonStyle, {backgroundColor:'white'}]}>
                <Loading/>
            </View>
        );
    }

  return (
    <Pressable testID={'button'} onPress={onPress} style={[styles.button, buttonStyle, hasShadow && shadowStyle]}>
        <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  )
}
Button.propTypes={
    buttonStyle:PropTypes.object,
    textStyle:PropTypes.object,
    title:PropTypes.string,
    onPress:PropTypes.func,
    loading:PropTypes.bool,
    hasShadow:PropTypes.bool
}
export default Button

const styles = StyleSheet.create({
    button:{
        backgroundColor: theme.colors.primary,
        height: hp(6.6),
        justifyContent:'center',
        alignItems:'center',
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl

    },
    text:{
        fontSize: hp(2.5),
        color: theme.colors.white,
        fontWeight: theme.fonts.bold
    }
})
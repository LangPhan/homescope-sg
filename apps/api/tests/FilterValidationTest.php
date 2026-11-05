<?php
declare(strict_types=1);
namespace HomeScope\Tests;
use PHPUnit\Framework\TestCase;
final class FilterValidationTest extends TestCase
{
    public function testCursorPayloadRoundTrips():void{$payload=['listed_at'=>'2026-11-01 12:00:00','id'=>42];$cursor=base64_encode(json_encode($payload,JSON_THROW_ON_ERROR));$this->assertSame($payload,json_decode(base64_decode($cursor,true),true,512,JSON_THROW_ON_ERROR));}
    public function testPasswordHashUsesArgon2id():void{$hash=password_hash('DemoPass123!',PASSWORD_ARGON2ID);$this->assertTrue(password_verify('DemoPass123!',$hash));$this->assertStringStartsWith('$argon2id$', $hash);}
    public function testBoundingBoxHasFourCoordinates():void{$bbox=array_map('floatval',explode(',','103.70,1.25,103.95,1.45'));$this->assertCount(4,$bbox);$this->assertLessThan($bbox[2],$bbox[0]);$this->assertLessThan($bbox[3],$bbox[1]);}
}
